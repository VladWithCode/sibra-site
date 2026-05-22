-- +goose Up
-- +goose StatementBegin
ALTER TABLE properties ADD COLUMN title VARCHAR(512) NOT NULL DEFAULT '';
UPDATE properties SET address = address || ', ' || nb_hood WHERE nb_hood IS NOT NULL AND nb_hood != '';
ALTER TABLE properties DROP COLUMN nb_hood;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE properties ADD COLUMN nb_hood VARCHAR(128) DEFAULT '';
-- +goose StatementEnd
