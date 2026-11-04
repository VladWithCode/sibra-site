-- +goose Up
-- +goose StatementBegin
-- Uploaded media processed by the background encoder (internal/media). Owners
-- (property_media, properties.main_asset_id, selling_pages.hero_asset_id) only
-- reference rows here; encoded files live in web/static/media/{id}/.
CREATE TABLE media_assets (
    id          UUID PRIMARY KEY,
    kind        VARCHAR(8)  NOT NULL CHECK (kind IN ('image', 'video')),
    status      VARCHAR(12) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    attempts    INT  NOT NULL DEFAULT 0,
    error       TEXT NOT NULL DEFAULT '',
    width       INT  NOT NULL DEFAULT 0,
    height      INT  NOT NULL DEFAULT 0,
    duration_ms INT  NOT NULL DEFAULT 0,
    has_audio   BOOLEAN NOT NULL DEFAULT false,
    -- Encoded outputs: {"images": [480, 960], "videos": [1080, 720], "poster": [480, 960]}.
    -- File names are derived from these values (see internal/media).
    variants    JSONB NOT NULL DEFAULT '{}',
    -- Legacy filename this asset was backfilled from (cmd/media-backfill), so
    -- re-runs only sync what changed. Dropped with the legacy columns.
    legacy_file VARCHAR(256),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX media_assets_pending_idx ON media_assets (kind, created_at) WHERE status = 'pending';

-- Ordered gallery of a property: images and videos mixed.
CREATE TABLE property_media (
    id          UUID PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    asset_id    UUID NOT NULL REFERENCES media_assets(id),
    position    INT  NOT NULL DEFAULT 0,
    -- Cover video plays in the home featured card. Must reference a video;
    -- enforced by the application (a CHECK cannot see media_assets.kind).
    is_cover    BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX property_media_property_id_idx ON property_media (property_id, position);
CREATE UNIQUE INDEX property_media_one_cover ON property_media (property_id) WHERE is_cover;

ALTER TABLE properties ADD COLUMN main_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL;

-- Named images now reference a gallery item; the legacy filename column is
-- kept (nullable) until the cleanup migration drops it.
ALTER TABLE property_named_images
    ADD COLUMN media_id UUID REFERENCES property_media(id) ON DELETE CASCADE,
    ALTER COLUMN image SET DEFAULT '';

ALTER TABLE selling_pages ADD COLUMN hero_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE selling_pages DROP COLUMN hero_asset_id;
ALTER TABLE property_named_images
    DROP COLUMN media_id,
    ALTER COLUMN image DROP DEFAULT;
ALTER TABLE properties DROP COLUMN main_asset_id;
DROP TABLE property_media;
DROP TABLE media_assets;
-- +goose StatementEnd
