-- +goose Up
-- +goose StatementBegin
ALTER TABLE properties ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_properties_deleted_at ON properties(deleted_at);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_properties_deleted_at;
ALTER TABLE properties DROP COLUMN IF EXISTS deleted_at;
-- +goose StatementEnd
