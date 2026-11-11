-- +goose Up
-- +goose StatementBegin
-- Plain-text summary used as the meta description / link preview of the
-- property page. Empty means "derive it from the description".
ALTER TABLE properties ADD COLUMN short_description TEXT NOT NULL DEFAULT '';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE properties DROP COLUMN short_description;
-- +goose StatementEnd
