-- +goose Up
-- +goose StatementBegin
-- Colonia / fraccionamiento of the property, sent in the Meta ads catalog.
-- Empty means unknown. An older migration merged the previous nb_hood column
-- into address as its last comma-separated segment, so the prefill below
-- recovers only the segments that clearly name a colonia; the rest stay empty
-- and are filled by hand in the panel. address is left untouched.
ALTER TABLE properties ADD COLUMN neighborhood VARCHAR(128) NOT NULL DEFAULT '';

UPDATE properties
SET neighborhood = left(btrim(substring(address from '[^,]*$')), 128)
WHERE address ~* ',\s*(col\.?|colonia|fracc\.?|fraccionamiento)\s+[^,]+$';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE properties DROP COLUMN neighborhood;
-- +goose StatementEnd
