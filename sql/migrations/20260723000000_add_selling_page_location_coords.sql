-- +goose Up
-- +goose StatementBegin
ALTER TABLE selling_pages ADD COLUMN location_lat DOUBLE PRECISION;
ALTER TABLE selling_pages ADD COLUMN location_lng DOUBLE PRECISION;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE selling_pages DROP COLUMN location_lat;
ALTER TABLE selling_pages DROP COLUMN location_lng;
-- +goose StatementEnd
