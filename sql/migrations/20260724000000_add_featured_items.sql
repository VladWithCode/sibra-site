-- +goose Up
-- +goose StatementBegin
CREATE TABLE featured_items (
    id UUID PRIMARY KEY,
    -- Kind of resource this card links to. Not constrained by CHECK on purpose:
    -- the resolvable kinds live in the application's resolver registry so new
    -- kinds can be added without a migration.
    kind VARCHAR(32) NOT NULL,
    -- ID of the linked internal resource (property/project/selling page/blog
    -- post). Empty for kind = 'external'.
    resource_id VARCHAR(64) NOT NULL DEFAULT '',
    external_url TEXT NOT NULL DEFAULT '',
    -- Optional overrides for internal kinds; required content for 'external'.
    title VARCHAR(200) NOT NULL DEFAULT '',
    image VARCHAR(256) NOT NULL DEFAULT '',
    subtitle VARCHAR(256) NOT NULL DEFAULT '',
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TABLE featured_settings (
    -- Single-row table enforced by the constant primary key.
    id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
    visible_count INT NOT NULL DEFAULT 3 CHECK (visible_count > 0)
);
-- +goose StatementEnd

-- +goose StatementBegin
INSERT INTO featured_settings (id, visible_count) VALUES (true, 3);
-- +goose StatementEnd

-- +goose StatementBegin
INSERT INTO featured_items (id, kind, resource_id, position)
SELECT
    gen_random_uuid(),
    'property',
    id::text,
    (row_number() OVER (ORDER BY listing_date DESC)) - 1
FROM properties
WHERE featured = true AND deleted_at IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE featured_items;
-- +goose StatementEnd

-- +goose StatementBegin
DROP TABLE featured_settings;
-- +goose StatementEnd
