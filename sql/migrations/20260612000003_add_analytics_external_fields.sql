-- +goose Up
-- +goose StatementBegin
-- Additive columns so external pages (outside this repo/app) can store richer
-- visit metadata. All default to '' to keep the existing /track ingestion and
-- prior rows valid.
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS url        TEXT NOT NULL DEFAULT '';
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS title      TEXT NOT NULL DEFAULT '';
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS source     TEXT NOT NULL DEFAULT '';
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS site       TEXT NOT NULL DEFAULT '';
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS visitor_id TEXT NOT NULL DEFAULT '';
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS origin     TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_page_views_site ON page_views (site);
CREATE INDEX IF NOT EXISTS idx_page_views_source ON page_views (source);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_page_views_source;
DROP INDEX IF EXISTS idx_page_views_site;
ALTER TABLE page_views DROP COLUMN IF EXISTS origin;
ALTER TABLE page_views DROP COLUMN IF EXISTS visitor_id;
ALTER TABLE page_views DROP COLUMN IF EXISTS site;
ALTER TABLE page_views DROP COLUMN IF EXISTS source;
ALTER TABLE page_views DROP COLUMN IF EXISTS title;
ALTER TABLE page_views DROP COLUMN IF EXISTS url;
-- +goose StatementEnd
