-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS property_details (
    id          UUID PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category    VARCHAR(16)  NOT NULL DEFAULT 'interior',
    icon        VARCHAR(64)  NOT NULL DEFAULT '',
    name        VARCHAR(128) NOT NULL,
    value       VARCHAR(256) NOT NULL DEFAULT '',
    position    INT          NOT NULL DEFAULT 0,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (category IN ('interior', 'exterior'))
);

CREATE INDEX IF NOT EXISTS property_details_property_id_idx ON property_details (property_id);

CREATE TABLE IF NOT EXISTS property_named_images (
    id          UUID PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category    VARCHAR(16)  NOT NULL DEFAULT 'interior',
    image       VARCHAR(256) NOT NULL,
    caption     VARCHAR(128) NOT NULL DEFAULT '',
    position    INT          NOT NULL DEFAULT 0,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (category IN ('interior', 'exterior'))
);

CREATE INDEX IF NOT EXISTS property_named_images_property_id_idx ON property_named_images (property_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS property_named_images_property_id_idx;
DROP TABLE IF EXISTS property_named_images;

DROP INDEX IF EXISTS property_details_property_id_idx;
DROP TABLE IF EXISTS property_details;
-- +goose StatementEnd
