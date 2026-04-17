package db

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ListFeatures returns every feature in the catalog, ordered by title.
func ListFeatures(ctx context.Context) ([]*PropertyFeature, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `SELECT id, icon, title, description FROM features ORDER BY title`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]*PropertyFeature, 0)
	for rows.Next() {
		var f PropertyFeature
		if err := rows.Scan(&f.ID, &f.Icon, &f.Title, &f.Description); err != nil {
			return nil, err
		}
		items = append(items, &f)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

// FindFeatureByID returns the feature with the given id.
func FindFeatureByID(ctx context.Context, id string) (*PropertyFeature, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `SELECT id, icon, title, description FROM features WHERE id = $1`, id)

	var f PropertyFeature
	if err := row.Scan(&f.ID, &f.Icon, &f.Title, &f.Description); err != nil {
		return nil, err
	}
	return &f, nil
}

// CreateFeature inserts a new feature into the catalog. If Title collides with
// an existing feature (case-insensitive), an error is returned.
func CreateFeature(ctx context.Context, f *PropertyFeature) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if f.ID == "" {
		f.ID = uuid.Must(uuid.NewV7()).String()
	}
	f.Title = strings.TrimSpace(f.Title)
	if f.Title == "" {
		return errors.New("feature title is required")
	}

	_, err = conn.Exec(
		ctx,
		`INSERT INTO features (id, icon, title, description)
         VALUES (@id, @icon, @title, @description)`,
		pgx.NamedArgs{
			"id":          f.ID,
			"icon":        f.Icon,
			"title":       f.Title,
			"description": f.Description,
		},
	)
	return err
}

// UpdateFeature updates an existing catalog entry.
func UpdateFeature(ctx context.Context, f *PropertyFeature) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if f.ID == "" {
		return errors.New("feature id is required")
	}
	f.Title = strings.TrimSpace(f.Title)
	if f.Title == "" {
		return errors.New("feature title is required")
	}

	_, err = conn.Exec(
		ctx,
		`UPDATE features SET
            icon = @icon, title = @title, description = @description, updated_at = NOW()
        WHERE id = @id`,
		pgx.NamedArgs{
			"id":          f.ID,
			"icon":        f.Icon,
			"title":       f.Title,
			"description": f.Description,
		},
	)
	return err
}

// DeleteFeature removes a catalog entry. Junction rows referencing it are
// deleted by the database (ON DELETE CASCADE).
func DeleteFeature(ctx context.Context, id string) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, `DELETE FROM features WHERE id = $1`, id)
	return err
}

// upsertPropertyFeatures upserts the catalog entries for the provided slice,
// matching existing rows by lower(title). Returns the resolved catalog IDs in
// the same order as the input. It is intended to run inside an existing
// transaction.
func upsertPropertyFeatures(ctx context.Context, tx pgx.Tx, feats []PropertyFeature) ([]string, error) {
	ids := make([]string, len(feats))
	for i := range feats {
		feats[i].Title = strings.TrimSpace(feats[i].Title)
		if feats[i].Title == "" {
			return nil, errors.New("feature title is required")
		}
		if feats[i].ID == "" {
			feats[i].ID = uuid.Must(uuid.NewV7()).String()
		}

		row := tx.QueryRow(
			ctx,
			`INSERT INTO features (id, icon, title, description)
             VALUES (@id, @icon, @title, @description)
             ON CONFLICT (LOWER(title)) DO UPDATE SET
                icon = EXCLUDED.icon,
                description = EXCLUDED.description,
                updated_at = NOW()
             RETURNING id`,
			pgx.NamedArgs{
				"id":          feats[i].ID,
				"icon":        feats[i].Icon,
				"title":       feats[i].Title,
				"description": feats[i].Description,
			},
		)
		var resolvedID string
		if err := row.Scan(&resolvedID); err != nil {
			return nil, err
		}
		feats[i].ID = resolvedID
		ids[i] = resolvedID
	}
	return ids, nil
}

// replacePropertyFeatureLinks wipes and re-inserts the junction rows linking
// the property to the given feature IDs. Intended to run inside a transaction.
func replacePropertyFeatureLinks(ctx context.Context, tx pgx.Tx, propertyID string, featureIDs []string) error {
	if _, err := tx.Exec(ctx, `DELETE FROM property_features WHERE property_id = $1`, propertyID); err != nil {
		return err
	}
	if len(featureIDs) == 0 {
		return nil
	}

	batch := pgx.Batch{}
	seen := make(map[string]struct{}, len(featureIDs))
	position := 0
	for _, fid := range featureIDs {
		if _, dup := seen[fid]; dup {
			continue
		}
		seen[fid] = struct{}{}

		batch.Queue(
			`INSERT INTO property_features (property_id, feature_id, position)
             VALUES (@property_id, @feature_id, @position)`,
			pgx.NamedArgs{
				"property_id": propertyID,
				"feature_id":  fid,
				"position":    position,
			},
		)
		position++
	}

	bres := tx.SendBatch(ctx, &batch)
	for i := 0; i < batch.Len(); i++ {
		if _, err := bres.Exec(); err != nil {
			bres.Close()
			return err
		}
	}
	return bres.Close()
}
