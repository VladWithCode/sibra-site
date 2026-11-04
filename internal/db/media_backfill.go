package db

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
)

// Backfill support for cmd/media-backfill: migrates legacy filename columns
// (properties.main_img/imgs, selling_pages.hero_media) to media assets. Assets
// remember their legacy_file so re-runs only sync what changed. Remove with
// the legacy columns.

// BackfillAsset is an already encoded asset created from a legacy file.
type BackfillAsset struct {
	ID         string
	Kind       string
	LegacyFile string
	Width      int
	Height     int
	DurationMs int
	HasAudio   bool
	Variants   MediaVariants
}

// LegacyRef points at a gallery item created from a legacy file.
type LegacyRef struct {
	MediaID string
	AssetID string
}

// LegacyPropertyMedia is the legacy and already-migrated media of a property.
type LegacyPropertyMedia struct {
	ID      string
	MainImg string
	Imgs    []string
	// HasMain reports whether a main asset is set; MainLegacy is its
	// legacy_file ("" when it was uploaded through the new panel).
	HasMain    bool
	MainLegacy string
	// Gallery maps legacy filenames to the items created from them.
	Gallery map[string]LegacyRef
}

// ListLegacyPropertyMedia returns every non-deleted property with its legacy
// filenames and the legacy-backed assets created so far.
func ListLegacyPropertyMedia(ctx context.Context) ([]*LegacyPropertyMedia, error) {
	rows, err := DB.Query(ctx, `
		SELECT p.id, COALESCE(p.main_img, ''), COALESCE(p.imgs, '{}'),
			p.main_asset_id IS NOT NULL,
			COALESCE((SELECT legacy_file FROM media_assets WHERE id = p.main_asset_id), ''),
			COALESCE((
				SELECT jsonb_object_agg(ma.legacy_file, jsonb_build_object('mediaId', pm.id, 'assetId', ma.id))
				FROM property_media pm JOIN media_assets ma ON ma.id = pm.asset_id
				WHERE pm.property_id = p.id AND ma.legacy_file IS NOT NULL
			), '{}'::jsonb)
		FROM properties p
		WHERE p.deleted_at IS NULL
		ORDER BY p.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*LegacyPropertyMedia
	for rows.Next() {
		lp := &LegacyPropertyMedia{}
		var gallery []byte
		if err := rows.Scan(&lp.ID, &lp.MainImg, &lp.Imgs, &lp.HasMain, &lp.MainLegacy, &gallery); err != nil {
			return nil, err
		}
		var refs map[string]struct {
			MediaID string `json:"mediaId"`
			AssetID string `json:"assetId"`
		}
		if err := json.Unmarshal(gallery, &refs); err != nil {
			return nil, err
		}
		lp.Gallery = make(map[string]LegacyRef, len(refs))
		for file, r := range refs {
			lp.Gallery[file] = LegacyRef{MediaID: r.MediaID, AssetID: r.AssetID}
		}
		out = append(out, lp)
	}
	return out, rows.Err()
}

func insertReadyAsset(ctx context.Context, tx pgx.Tx, a BackfillAsset) error {
	vj, err := json.Marshal(a.Variants)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO media_assets (id, kind, status, width, height, duration_ms, has_audio, variants, legacy_file)
		VALUES ($1, $2, 'ready', $3, $4, $5, $6, $7, $8)`,
		a.ID, a.Kind, a.Width, a.Height, a.DurationMs, a.HasAudio, vj, a.LegacyFile)
	return err
}

// BackfillAppendPropertyMedia appends encoded legacy images to the end of a
// property's gallery and links named images that referenced their filenames.
func BackfillAppendPropertyMedia(ctx context.Context, propertyID string, assets []BackfillAsset) error {
	tx, err := DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var next int
	err = tx.QueryRow(ctx, `
		SELECT COALESCE((SELECT MAX(position) + 1 FROM property_media WHERE property_id = p.id), 0)
		FROM properties p WHERE p.id = $1 FOR UPDATE`, propertyID).Scan(&next)
	if err != nil {
		return err
	}
	for i, a := range assets {
		if err := insertReadyAsset(ctx, tx, a); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `INSERT INTO property_media (id, property_id, asset_id, position) VALUES ($1, $2, $3, $4)`,
			NewMediaID(), propertyID, a.ID, next+i); err != nil {
			return err
		}
	}
	if _, err := tx.Exec(ctx, `
		UPDATE property_named_images ni SET media_id = pm.id
		FROM property_media pm JOIN media_assets ma ON ma.id = pm.asset_id
		WHERE ni.property_id = $1 AND ni.media_id IS NULL
			AND pm.property_id = ni.property_id AND ma.legacy_file = ni.image`, propertyID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// BackfillSetPropertyMain sets an encoded legacy image as the main image,
// returning the replaced asset id ("" when none).
func BackfillSetPropertyMain(ctx context.Context, propertyID string, a BackfillAsset) (string, error) {
	tx, err := DB.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	var prev *string
	if err := tx.QueryRow(ctx, `SELECT main_asset_id::text FROM properties WHERE id = $1 FOR UPDATE`, propertyID).Scan(&prev); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrMediaNotFound
		}
		return "", err
	}
	if err := insertReadyAsset(ctx, tx, a); err != nil {
		return "", err
	}
	if _, err := tx.Exec(ctx, `UPDATE properties SET main_asset_id = $1 WHERE id = $2`, a.ID, propertyID); err != nil {
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
