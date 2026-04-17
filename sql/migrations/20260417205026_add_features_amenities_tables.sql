-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS features (
    id          UUID PRIMARY KEY,
    icon        VARCHAR(64)  NOT NULL DEFAULT '',
    title       VARCHAR(128) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS features_title_lower_key ON features (LOWER(title));

CREATE TABLE IF NOT EXISTS amenities (
    id         UUID PRIMARY KEY,
    icon       VARCHAR(64)  NOT NULL DEFAULT '',
    title      VARCHAR(128) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS amenities_title_lower_key ON amenities (LOWER(title));

CREATE TABLE IF NOT EXISTS property_features (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    feature_id  UUID NOT NULL REFERENCES features(id)   ON DELETE CASCADE,
    position    INT  NOT NULL DEFAULT 0,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (property_id, feature_id)
);

CREATE INDEX IF NOT EXISTS property_features_feature_id_idx ON property_features (feature_id);

CREATE TABLE IF NOT EXISTS property_amenities (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_id  UUID NOT NULL REFERENCES amenities(id)  ON DELETE CASCADE,
    position    INT  NOT NULL DEFAULT 0,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (property_id, amenity_id)
);

CREATE INDEX IF NOT EXISTS property_amenities_amenity_id_idx ON property_amenities (amenity_id);

ALTER TABLE properties DROP COLUMN IF EXISTS features;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE properties ADD COLUMN IF NOT EXISTS features JSONB;

DROP INDEX IF EXISTS property_amenities_amenity_id_idx;
DROP TABLE IF EXISTS property_amenities;

DROP INDEX IF EXISTS property_features_feature_id_idx;
DROP TABLE IF EXISTS property_features;

DROP INDEX IF EXISTS amenities_title_lower_key;
DROP TABLE IF EXISTS amenities;

DROP INDEX IF EXISTS features_title_lower_key;
DROP TABLE IF EXISTS features;
-- +goose StatementEnd
