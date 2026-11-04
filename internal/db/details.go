package db

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// normalizeDetailCategory coerces an arbitrary category string to one of the
// two supported values, defaulting to "interior".
func normalizeDetailCategory(category string) string {
	if strings.EqualFold(strings.TrimSpace(category), "exterior") {
		return "exterior"
	}
	return "interior"
}

// replacePropertyDetails wipes and re-inserts the per-property detail rows.
// Intended to run inside an existing transaction. Rows with an empty Name are
// skipped. Position is taken from the slice order.
func replacePropertyDetails(ctx context.Context, tx pgx.Tx, propertyID string, details []PropertyDetail) error {
	if _, err := tx.Exec(ctx, `DELETE FROM property_details WHERE property_id = $1`, propertyID); err != nil {
		return err
	}
	if len(details) == 0 {
		return nil
	}

	batch := pgx.Batch{}
	position := 0
	for _, d := range details {
		name := strings.TrimSpace(d.Name)
		if name == "" {
			continue
		}

		batch.Queue(
			`INSERT INTO property_details (id, property_id, category, icon, name, value, position)
             VALUES (@id, @property_id, @category, @icon, @name, @value, @position)`,
			pgx.NamedArgs{
				"id":          uuid.Must(uuid.NewV7()).String(),
				"property_id": propertyID,
				"category":    normalizeDetailCategory(d.Category),
				"icon":        d.Icon,
				"name":        name,
				"value":       strings.TrimSpace(d.Value),
				"position":    position,
			},
		)
		position++
	}

	if batch.Len() == 0 {
		return nil
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

// replacePropertyNamedImages wipes and re-inserts the per-property named image
// rows. Intended to run inside an existing transaction. Only image items of
// the property's own gallery are persisted (the INSERT ... SELECT skips any
// other media id), preventing dangling or foreign references. Position is
// taken from the slice order.
func replacePropertyNamedImages(ctx context.Context, tx pgx.Tx, propertyID string, images []PropertyNamedImage) error {
	if _, err := tx.Exec(ctx, `DELETE FROM property_named_images WHERE property_id = $1`, propertyID); err != nil {
		return err
	}

	batch := pgx.Batch{}
	for position, ni := range images {
		mediaID := strings.TrimSpace(ni.MediaID)
		if uuid.Validate(mediaID) != nil {
			continue
		}
		batch.Queue(
			`INSERT INTO property_named_images (id, property_id, category, media_id, caption, position)
             SELECT @id, @property_id, @category, pm.id, @caption, @position
             FROM property_media pm
             JOIN media_assets ma ON ma.id = pm.asset_id
             WHERE pm.id = @media_id AND pm.property_id = @property_id AND ma.kind = 'image'`,
			pgx.NamedArgs{
				"id":          uuid.Must(uuid.NewV7()).String(),
				"property_id": propertyID,
				"category":    normalizeDetailCategory(ni.Category),
				"media_id":    mediaID,
				"caption":     strings.TrimSpace(ni.Caption),
				"position":    position,
			},
		)
	}

	if batch.Len() == 0 {
		return nil
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
