-- +goose Up
-- +goose StatementBegin
ALTER TABLE selling_pages ADD COLUMN availability_plan_img VARCHAR(256) NOT NULL DEFAULT '';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE selling_pages DROP COLUMN availability_plan_img;
-- +goose StatementEnd
