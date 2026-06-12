-- +goose Up
-- Remove existing page views from /panel routes since they are no longer tracked.
DELETE FROM page_views WHERE path LIKE '/panel%';

-- +goose Down
-- No way to restore deleted data.
