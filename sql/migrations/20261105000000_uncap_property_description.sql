-- +goose Up
-- +goose StatementBegin
-- Property descriptions have no length limit; the panel only hints when one gets long.
-- VARCHAR -> TEXT is binary-compatible: no table rewrite, dependent search index is rebuilt.
ALTER TABLE properties ALTER COLUMN description TYPE TEXT;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Fails if any description is longer than 512 characters; shorten those rows first.
ALTER TABLE properties ALTER COLUMN description TYPE VARCHAR(512);
-- +goose StatementEnd
