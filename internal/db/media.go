package db

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

const (
	MediaStatusPending    = "pending"
	MediaStatusProcessing = "processing"
	MediaStatusReady      = "ready"
	MediaStatusFailed     = "failed"

	// MediaMaxAttempts is how many times the worker tries to encode an asset
	// before marking it failed.
	MediaMaxAttempts = 3
)

var (
	ErrMediaNotFound  = errors.New("media not found")
	ErrMediaCoverKind = errors.New("only videos can be the cover")
	ErrMediaOrderSet  = errors.New("order must list every media item of the property exactly once")
)

// MediaVariants lists the encoded outputs of an asset. File names derive
// from these values (see internal/media).
type MediaVariants struct {
	Images []int `json:"images,omitempty"`
	Videos []int `json:"videos,omitempty"`
	Poster []int `json:"poster,omitempty"`
}

// MediaAsset is an uploaded image or video and its encoding state.
type MediaAsset struct {
	ID         string        `json:"id"`
	Kind       string        `json:"kind"`
	Status     string        `json:"status"`
	Error      string        `json:"error,omitempty"`
	Width      int           `json:"width"`
	Height     int           `json:"height"`
	DurationMs int           `json:"durationMs,omitempty"`
	HasAudio   bool          `json:"hasAudio"`
	Variants   MediaVariants `json:"variants"`
	Attempts   int           `json:"-"`
}

// mediaAssetJSON builds the JSON object of a media_assets row aliased as
// `alias`, in the shape of MediaAsset. Used to embed assets in property
// queries.
func mediaAssetJSON(alias string) string {
	return fmt.Sprintf(`jsonb_build_object(
		'id', %[1]s.id, 'kind', %[1]s.kind, 'status', %[1]s.status, 'error', %[1]s.error,
		'width', %[1]s.width, 'height', %[1]s.height, 'durationMs', %[1]s.duration_ms,
		'hasAudio', %[1]s.has_audio, 'variants', %[1]s.variants)`, alias)
}

const mediaAssetColumns = `id, kind, status, error, width, height, duration_ms, has_audio, variants, attempts`

func scanMediaAsset(row pgx.Row) (*MediaAsset, error) {
	var a MediaAsset
	var variants []byte
	if err := row.Scan(&a.ID, &a.Kind, &a.Status, &a.Error, &a.Width, &a.Height,
		&a.DurationMs, &a.HasAudio, &variants, &a.Attempts); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(variants, &a.Variants); err != nil {
		return nil, err
	}
	return &a, nil
}

// insertMediaAsset creates a pending asset row inside tx.
func insertMediaAsset(ctx context.Context, tx pgx.Tx, id, kind string) error {
	_, err := tx.Exec(ctx, `INSERT INTO media_assets (id, kind) VALUES ($1, $2)`, id, kind)
	return err
}

// NewMediaID returns a new asset/media id.
func NewMediaID() string { return uuid.Must(uuid.NewV7()).String() }

// GetMediaAsset loads one asset.
func GetMediaAsset(ctx context.Context, id string) (*MediaAsset, error) {
	a, err := scanMediaAsset(DB.QueryRow(ctx, `SELECT `+mediaAssetColumns+` FROM media_assets WHERE id = $1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMediaNotFound
	}
	return a, err
}

// ClaimPendingMediaAsset marks the oldest pending asset of kind as
// processing and returns it, or nil when none is pending. SKIP LOCKED keeps
// concurrent workers from claiming the same row.
func ClaimPendingMediaAsset(ctx context.Context, kind string) (*MediaAsset, error) {
	a, err := scanMediaAsset(DB.QueryRow(ctx, `
		UPDATE media_assets SET status = 'processing', attempts = attempts + 1, updated_at = now()
		WHERE id = (
			SELECT id FROM media_assets
			WHERE status = 'pending' AND kind = $1
			ORDER BY created_at
			FOR UPDATE SKIP LOCKED
			LIMIT 1
		)
		RETURNING `+mediaAssetColumns, kind))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return a, err
}

// CompleteMediaAsset stores the encoding result and marks the asset ready.
// It returns false when the asset no longer exists (deleted while encoding).
func CompleteMediaAsset(ctx context.Context, id string, width, height, durationMs int, hasAudio bool, variants MediaVariants) (bool, error) {
	vj, err := json.Marshal(variants)
	if err != nil {
		return false, err
	}
	tag, err := DB.Exec(ctx, `
		UPDATE media_assets SET status = 'ready', error = '', width = $2, height = $3,
			duration_ms = $4, has_audio = $5, variants = $6, updated_at = now()
		WHERE id = $1`, id, width, height, durationMs, hasAudio, vj)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() == 1, nil
}

// FailMediaAssetAttempt records a failed encode. The asset returns to
// pending until MediaMaxAttempts is reached, then becomes failed. It reports
// whether the failure is final.
func FailMediaAssetAttempt(ctx context.Context, id, message string) (bool, error) {
	var status string
	err := DB.QueryRow(ctx, `
		UPDATE media_assets
		SET status = CASE WHEN attempts >= $3 THEN 'failed' ELSE 'pending' END,
			error = $2, updated_at = now()
		WHERE id = $1
		RETURNING status`, id, message, MediaMaxAttempts).Scan(&status)
	if errors.Is(err, pgx.ErrNoRows) {
		return true, nil
	}
	return status == MediaStatusFailed, err
}

// FailMediaAsset marks an asset failed immediately (unrecoverable input).
func FailMediaAsset(ctx context.Context, id, message string) error {
	_, err := DB.Exec(ctx, `UPDATE media_assets SET status = 'failed', error = $2, updated_at = now() WHERE id = $1`, id, message)
	return err
}

// ReleaseMediaAsset returns a claimed asset to pending without counting the
// attempt (shutdown, low disk).
func ReleaseMediaAsset(ctx context.Context, id string) error {
	_, err := DB.Exec(ctx, `
		UPDATE media_assets SET status = 'pending', attempts = GREATEST(attempts - 1, 0), updated_at = now()
		WHERE id = $1 AND status = 'processing'`, id)
	return err
}

// ResetProcessingMediaAssets returns assets left in processing by a crash to
// pending. Called once at startup, before workers run.
func ResetProcessingMediaAssets(ctx context.Context) (int64, error) {
	tag, err := DB.Exec(ctx, `UPDATE media_assets SET status = 'pending', updated_at = now() WHERE status = 'processing'`)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

// ------------------------------------------------------------------
// Property media
// ------------------------------------------------------------------

// PropertyMedia is one gallery item of a property.
type PropertyMedia struct {
	ID       string     `json:"id"`
	Position int        `json:"position"`
	IsCover  bool       `json:"isCover"`
	Asset    MediaAsset `json:"asset"`
}

// NewMediaUpload is an uploaded file already stored under the asset id.
type NewMediaUpload struct {
	AssetID string
	Kind    string
}

// unmarshalAsset decodes an optional asset JSON column (NULL -> nil).
func unmarshalAsset(b []byte) (*MediaAsset, error) {
	if b == nil {
		return nil, nil
	}
	var a MediaAsset
	if err := json.Unmarshal(b, &a); err != nil {
		return nil, err
	}
	return &a, nil
}

// propertyMediaJSONAgg aggregates the gallery of property alias `p` ordered
// by position. readyOnly hides items still encoding (public pages).
func propertyMediaJSONAgg(readyOnly bool) string {
	cond := ""
	if readyOnly {
		cond = " AND ma.status = 'ready'"
	}
	return `COALESCE((
		SELECT jsonb_agg(jsonb_build_object(
			'id', pm.id, 'position', pm.position, 'isCover', pm.is_cover,
			'asset', ` + mediaAssetJSON("ma") + `
		) ORDER BY pm.position, pm.created_at)
		FROM property_media pm
		JOIN media_assets ma ON ma.id = pm.asset_id
		WHERE pm.property_id = p.id` + cond + `
	), '[]'::jsonb)`
}

// propertyMainImageJSON selects the main image asset of the property row
// aliased `alias` (NULL when unset or, with readyOnly, still encoding).
func propertyMainImageJSON(alias string, readyOnly bool) string {
	cond := ""
	if readyOnly {
		cond = " AND mi.status = 'ready'"
	}
	return `(SELECT ` + mediaAssetJSON("mi") + ` FROM media_assets mi WHERE mi.id = ` + alias + `.main_asset_id` + cond + `)`
}

// AddPropertyMedia appends uploaded assets to the end of a property's
// gallery and returns the new items.
func AddPropertyMedia(ctx context.Context, propertyID string, uploads []NewMediaUpload) ([]PropertyMedia, error) {
	tx, err := DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Lock the property row so concurrent uploads get distinct positions.
	var next int
	err = tx.QueryRow(ctx, `
		SELECT COALESCE((SELECT MAX(position) + 1 FROM property_media WHERE property_id = p.id), 0)
		FROM properties p WHERE p.id = $1 AND p.deleted_at IS NULL FOR UPDATE`, propertyID).Scan(&next)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMediaNotFound
	}
	if err != nil {
		return nil, err
	}

	items := make([]PropertyMedia, 0, len(uploads))
	for i, u := range uploads {
		if err := insertMediaAsset(ctx, tx, u.AssetID, u.Kind); err != nil {
			return nil, err
		}
		item := PropertyMedia{
			ID:       NewMediaID(),
			Position: next + i,
			Asset:    MediaAsset{ID: u.AssetID, Kind: u.Kind, Status: MediaStatusPending},
		}
		if _, err := tx.Exec(ctx, `INSERT INTO property_media (id, property_id, asset_id, position) VALUES ($1, $2, $3, $4)`,
			item.ID, propertyID, u.AssetID, item.Position); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, tx.Commit(ctx)
}

// PropertyMediaState is the panel view of a property's media, including
// items that are still encoding or failed.
type PropertyMediaState struct {
	MainImage *MediaAsset     `json:"mainImage"`
	Media     []PropertyMedia `json:"media"`
}

// GetPropertyMediaState returns the main image and gallery of a property
// regardless of encoding status.
func GetPropertyMediaState(ctx context.Context, propertyID string) (*PropertyMediaState, error) {
	var mediaJSON, mainJSON []byte
	err := DB.QueryRow(ctx, `SELECT `+propertyMediaJSONAgg(false)+`, `+propertyMainImageJSON("p", false)+`
		FROM properties p WHERE p.id = $1 AND p.deleted_at IS NULL`, propertyID).Scan(&mediaJSON, &mainJSON)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrMediaNotFound
	}
	if err != nil {
		return nil, err
	}
	state := &PropertyMediaState{Media: []PropertyMedia{}}
	if err := json.Unmarshal(mediaJSON, &state.Media); err != nil {
		return nil, err
	}
	if mainJSON != nil {
		if err := json.Unmarshal(mainJSON, &state.MainImage); err != nil {
			return nil, err
		}
	}
	return state, nil
}

// ReorderPropertyMedia sets gallery positions from ids, which must contain
// every media item of the property exactly once.
func ReorderPropertyMedia(ctx context.Context, propertyID string, ids []string) error {
	tx, err := DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `SELECT id FROM property_media WHERE property_id = $1 FOR UPDATE`, propertyID)
	if err != nil {
		return err
	}
	existing := map[string]bool{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		existing[id] = true
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	if len(ids) != len(existing) {
		return ErrMediaOrderSet
	}
	seen := map[string]bool{}
	for _, id := range ids {
		if !existing[id] || seen[id] {
			return ErrMediaOrderSet
		}
		seen[id] = true
	}
	for pos, id := range ids {
		if _, err := tx.Exec(ctx, `UPDATE property_media SET position = $1 WHERE id = $2`, pos, id); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// SetPropertyCover makes a video the property's cover (clearing any other)
// or removes the cover flag from it.
func SetPropertyCover(ctx context.Context, propertyID, mediaID string, isCover bool) error {
	tx, err := DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var kind string
	err = tx.QueryRow(ctx, `
		SELECT ma.kind FROM property_media pm JOIN media_assets ma ON ma.id = pm.asset_id
		WHERE pm.id = $1 AND pm.property_id = $2`, mediaID, propertyID).Scan(&kind)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrMediaNotFound
	}
	if err != nil {
		return err
	}
	if isCover && kind != "video" {
		return ErrMediaCoverKind
	}
	if isCover {
		if _, err := tx.Exec(ctx, `UPDATE property_media SET is_cover = false WHERE property_id = $1 AND is_cover`, propertyID); err != nil {
			return err
		}
	}
	if _, err := tx.Exec(ctx, `UPDATE property_media SET is_cover = $1 WHERE id = $2`, isCover, mediaID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// DeletePropertyMedia removes a gallery item and its asset row, returning
// the asset id so the caller can delete its files after the commit.
func DeletePropertyMedia(ctx context.Context, propertyID, mediaID string) (string, error) {
	tx, err := DB.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	var assetID string
	err = tx.QueryRow(ctx, `DELETE FROM property_media WHERE id = $1 AND property_id = $2 RETURNING asset_id`,
		mediaID, propertyID).Scan(&assetID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrMediaNotFound
	}
	if err != nil {
		return "", err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM media_assets WHERE id = $1`, assetID); err != nil {
		return "", err
	}
	return assetID, tx.Commit(ctx)
}

// SetPropertyMainImage stores a new pending image asset as the property's
// main image and deletes the previous one. It returns the previous asset id
// ("" when none) so the caller can delete its files after the commit.
func SetPropertyMainImage(ctx context.Context, propertyID, assetID string) (string, error) {
	tx, err := DB.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	var prev *string
	err = tx.QueryRow(ctx, `SELECT main_asset_id::text FROM properties WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
		propertyID).Scan(&prev)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrMediaNotFound
	}
	if err != nil {
		return "", err
	}
	if err := insertMediaAsset(ctx, tx, assetID, "image"); err != nil {
		return "", err
	}
	if _, err := tx.Exec(ctx, `UPDATE properties SET main_asset_id = $1, updated_at = now() WHERE id = $2`, assetID, propertyID); err != nil {
		return "", err
	}
	old := ""
	if prev != nil {
		old = *prev
		if _, err := tx.Exec(ctx, `DELETE FROM media_assets WHERE id = $1`, old); err != nil {
			return "", err
		}
	}
	return old, tx.Commit(ctx)
}

// ClearPropertyMainImage removes the main image, returning its asset id.
func ClearPropertyMainImage(ctx context.Context, propertyID string) (string, error) {
	tx, err := DB.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	var prev *string
	err = tx.QueryRow(ctx, `SELECT main_asset_id::text FROM properties WHERE id = $1 FOR UPDATE`, propertyID).Scan(&prev)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && prev == nil) {
		return "", ErrMediaNotFound
	}
	if err != nil {
		return "", err
	}
	if _, err := tx.Exec(ctx, `UPDATE properties SET main_asset_id = NULL, updated_at = now() WHERE id = $1`, propertyID); err != nil {
		return "", err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM media_assets WHERE id = $1`, *prev); err != nil {
		return "", err
	}
	return *prev, tx.Commit(ctx)
}
