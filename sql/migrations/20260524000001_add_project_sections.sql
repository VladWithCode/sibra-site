-- +goose Up
-- +goose StatementBegin

-- gen_random_uuid() is built-in on Postgres 13+; on older servers pgcrypto
-- provides it. Safe to ensure regardless.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS project_sections (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    position    INT          NOT NULL,
    title       VARCHAR(200) NOT NULL DEFAULT '',
    body        TEXT         NOT NULL DEFAULT '',
    image       VARCHAR(255) NOT NULL DEFAULT '',
    image_side  VARCHAR(8)   NOT NULL DEFAULT 'right'
                     CHECK (image_side IN ('left', 'right')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_sections_project
    ON project_sections (project_id, position);

-- Backfill: one section per project where description is not empty.
-- body = description, position = 0, image = '' (default).
-- gen_random_uuid() supplies id; consistent with column DEFAULT.
INSERT INTO project_sections (project_id, position, body)
SELECT id, 0, description
FROM projects
WHERE description IS NOT NULL AND description <> '';

ALTER TABLE projects DROP COLUMN description;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE projects ADD COLUMN description TEXT;

-- Restore description from the first section (lowest position) per project.
UPDATE projects p
SET description = sub.body
FROM (
    SELECT DISTINCT ON (project_id) project_id, body
    FROM project_sections
    ORDER BY project_id, position ASC
) sub
WHERE p.id = sub.project_id;

DROP INDEX IF EXISTS idx_project_sections_project;
DROP TABLE IF EXISTS project_sections;

-- +goose StatementEnd
