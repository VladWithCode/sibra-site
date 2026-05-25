-- +goose Up
-- +goose StatementBegin
ALTER TABLE projects ADD COLUMN quote_img VARCHAR(256);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE projects DROP COLUMN quote_img;
-- +goose StatementEnd
