package db

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ListAmenities returns every amenity in the catalog, ordered by title.
func ListAmenities(ctx context.Context) ([]*PropertyAmenity, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := conn.Query(ctx, `SELECT id, icon, title FROM amenities ORDER BY title`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]*PropertyAmenity, 0)
	for rows.Next() {
		var a PropertyAmenity
		if err := rows.Scan(&a.ID, &a.Icon, &a.Title); err != nil {
			return nil, err
		}
		items = append(items, &a)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

// FindAmenityByID returns the amenity with the given id.
func FindAmenityByID(ctx context.Context, id string) (*PropertyAmenity, error) {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return nil, err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	row := conn.QueryRow(ctx, `SELECT id, icon, title FROM amenities WHERE id = $1`, id)

	var a PropertyAmenity
	if err := row.Scan(&a.ID, &a.Icon, &a.Title); err != nil {
		return nil, err
	}
	return &a, nil
}

// CreateAmenity inserts a new amenity into the catalog.
func CreateAmenity(ctx context.Context, a *PropertyAmenity) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if a.ID == "" {
		a.ID = uuid.Must(uuid.NewV7()).String()
	}
	a.Title = strings.TrimSpace(a.Title)
	if a.Title == "" {
		return errors.New("amenity title is required")
	}

	_, err = conn.Exec(
		ctx,
		`INSERT INTO amenities (id, icon, title)
         VALUES (@id, @icon, @title)`,
		pgx.NamedArgs{
			"id":    a.ID,
			"icon":  a.Icon,
			"title": a.Title,
		},
	)
	return err
}

// UpdateAmenity updates an existing catalog entry.
func UpdateAmenity(ctx context.Context, a *PropertyAmenity) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if a.ID == "" {
		return errors.New("amenity id is required")
	}
	a.Title = strings.TrimSpace(a.Title)
	if a.Title == "" {
		return errors.New("amenity title is required")
	}

	_, err = conn.Exec(
		ctx,
		`UPDATE amenities SET
            icon = @icon, title = @title, updated_at = NOW()
        WHERE id = @id`,
		pgx.NamedArgs{
			"id":    a.ID,
			"icon":  a.Icon,
			"title": a.Title,
		},
	)
	return err
}

// DeleteAmenity removes a catalog entry. Junction rows referencing it are
// deleted by the database (ON DELETE CASCADE).
func DeleteAmenity(ctx context.Context, id string) error {
	conn, err := GetPoolWithCtx(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	_, err = conn.Exec(ctx, `DELETE FROM amenities WHERE id = $1`, id)
	return err
}

// upsertPropertyAmenities upserts the catalog entries for the provided slice,
// matching existing rows by lower(title). Returns the resolved catalog IDs in
// the same order as the input. It is intended to run inside an existing
// transaction.
func upsertPropertyAmenities(ctx context.Context, tx pgx.Tx, ams []PropertyAmenity) ([]string, error) {
	ids := make([]string, len(ams))
	for i := range ams {
		ams[i].Title = strings.TrimSpace(ams[i].Title)
		if ams[i].Title == "" {
			return nil, errors.New("amenity title is required")
		}
		if ams[i].ID == "" {
			ams[i].ID = uuid.Must(uuid.NewV7()).String()
		}

		row := tx.QueryRow(
			ctx,
			`INSERT INTO amenities (id, icon, title)
             VALUES (@id, @icon, @title)
             ON CONFLICT (LOWER(title)) DO UPDATE SET
                icon = EXCLUDED.icon,
                updated_at = NOW()
             RETURNING id`,
			pgx.NamedArgs{
				"id":    ams[i].ID,
				"icon":  ams[i].Icon,
				"title": ams[i].Title,
			},
		)
		var resolvedID string
		if err := row.Scan(&resolvedID); err != nil {
			return nil, err
		}
		ams[i].ID = resolvedID
		ids[i] = resolvedID
	}
	return ids, nil
}

// replacePropertyAmenityLinks wipes and re-inserts the junction rows linking
// the property to the given amenity IDs. Intended to run inside a transaction.
func replacePropertyAmenityLinks(ctx context.Context, tx pgx.Tx, propertyID string, amenityIDs []string) error {
	if _, err := tx.Exec(ctx, `DELETE FROM property_amenities WHERE property_id = $1`, propertyID); err != nil {
		return err
	}
	if len(amenityIDs) == 0 {
		return nil
	}

	batch := pgx.Batch{}
	seen := make(map[string]struct{}, len(amenityIDs))
	position := 0
	for _, aid := range amenityIDs {
		if _, dup := seen[aid]; dup {
			continue
		}
		seen[aid] = struct{}{}

		batch.Queue(
			`INSERT INTO property_amenities (property_id, amenity_id, position)
             VALUES (@property_id, @amenity_id, @position)`,
			pgx.NamedArgs{
				"property_id": propertyID,
				"amenity_id":  aid,
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
