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
// rows. Intended to run inside an existing transaction. Only images that belong
// to the property's gallery (validImages) are persisted, preventing dangling
// references. Position is taken from the slice order.
func replacePropertyNamedImages(ctx context.Context, tx pgx.Tx, propertyID string, images []PropertyNamedImage, validImages []string) error {
	if _, err := tx.Exec(ctx, `DELETE FROM property_named_images WHERE property_id = $1`, propertyID); err != nil {
		return err
	}
	if len(images) == 0 {
		return nil
	}

	valid := make(map[string]struct{}, len(validImages))
	for _, img := range validImages {
		valid[img] = struct{}{}
	}

	batch := pgx.Batch{}
	position := 0
	for _, ni := range images {
		img := strings.TrimSpace(ni.Image)
		if img == "" {
			continue
		}
		if _, ok := valid[img]; !ok {
			// Skip images that are not part of the property's gallery.
			continue
		}

		batch.Queue(
			`INSERT INTO property_named_images (id, property_id, category, image, caption, position)
             VALUES (@id, @property_id, @category, @image, @caption, @position)`,
			pgx.NamedArgs{
				"id":          uuid.Must(uuid.NewV7()).String(),
				"property_id": propertyID,
				"category":    normalizeDetailCategory(ni.Category),
				"image":       img,
				"caption":     strings.TrimSpace(ni.Caption),
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
