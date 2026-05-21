-- +goose Up
CREATE TABLE IF NOT EXISTS page_views (
    id          UUID PRIMARY KEY,
    path        TEXT NOT NULL,
    referrer    TEXT NOT NULL DEFAULT '',
    user_agent  TEXT NOT NULL DEFAULT '',
    ip_hash     TEXT NOT NULL DEFAULT '',
    session_id  TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_page_views_created_at ON page_views (created_at);
CREATE INDEX idx_page_views_path ON page_views (path);
CREATE INDEX idx_page_views_session ON page_views (session_id);

-- +goose Down
DROP TABLE IF EXISTS page_views;
