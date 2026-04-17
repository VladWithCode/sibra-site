-- +goose Up
-- +goose StatementBegin
ALTER TABLE projects
    ADD COLUMN quote          TEXT             NOT NULL DEFAULT '',
    ADD COLUMN summary        TEXT             NOT NULL DEFAULT '',
    ADD COLUMN location       VARCHAR(256)     NOT NULL DEFAULT '',
    ADD COLUMN total_area     DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN lot_count      INT              NOT NULL DEFAULT 0,
    ADD COLUMN available_lots INT              NOT NULL DEFAULT 0,
    ADD COLUMN lat            DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN lon            DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN earth_coords   POINT;

CREATE OR REPLACE FUNCTION update_project_earth_coords()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lon IS NOT NULL AND NEW.lat != 0 AND NEW.lon != 0 THEN
        NEW.earth_coords = point(NEW.lon, NEW.lat);
    ELSE
        NEW.earth_coords = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trigger_update_project_earth_coords
    BEFORE INSERT OR UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_project_earth_coords();

CREATE INDEX IF NOT EXISTS idx_projects_earth_coords ON projects USING gist (earth_coords);

CREATE TABLE appeal_items (
    id          UUID PRIMARY KEY,
    name        VARCHAR(160) NOT NULL,
    description TEXT NOT NULL DEFAULT '',

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_appeal_items (
    project_id     UUID REFERENCES projects(id)     ON DELETE CASCADE NOT NULL,
    appeal_item_id UUID REFERENCES appeal_items(id) ON DELETE CASCADE NOT NULL,
    position       INT  NOT NULL DEFAULT 0,

    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (project_id, appeal_item_id)
);

CREATE INDEX project_appeal_items_project_id_idx ON project_appeal_items (project_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS project_appeal_items_project_id_idx;
DROP TABLE IF EXISTS project_appeal_items;
DROP TABLE IF EXISTS appeal_items;

DROP INDEX IF EXISTS idx_projects_earth_coords;
DROP TRIGGER IF EXISTS trigger_update_project_earth_coords ON projects;
DROP FUNCTION IF EXISTS update_project_earth_coords();

ALTER TABLE projects
    DROP COLUMN IF EXISTS earth_coords,
    DROP COLUMN IF EXISTS lon,
    DROP COLUMN IF EXISTS lat,
    DROP COLUMN IF EXISTS available_lots,
    DROP COLUMN IF EXISTS lot_count,
    DROP COLUMN IF EXISTS total_area,
    DROP COLUMN IF EXISTS location,
    DROP COLUMN IF EXISTS summary,
    DROP COLUMN IF EXISTS quote;
-- +goose StatementEnd
