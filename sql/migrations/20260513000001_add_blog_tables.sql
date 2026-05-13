-- +goose Up
-- +goose StatementBegin

CREATE TABLE IF NOT EXISTS blog_posts (
    id           UUID         PRIMARY KEY,
    slug         VARCHAR(512) NOT NULL,
    title        VARCHAR(255) NOT NULL,
    snippet      TEXT,
    status       VARCHAR(16)  NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'published', 'archived')),
    reading_time INT,
    author_id    UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content_path TEXT         NOT NULL,
    cover_image  TEXT,
    published_at TIMESTAMPTZ,
    archived_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- slug must be unique: ensures no two live posts share a URL
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_key
    ON blog_posts (slug);

-- content_path must be unique: one .md file per post
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_content_path_key
    ON blog_posts (content_path);

CREATE INDEX IF NOT EXISTS blog_posts_status_idx
    ON blog_posts (status);

CREATE INDEX IF NOT EXISTS blog_posts_author_id_idx
    ON blog_posts (author_id);

-- Partial index: only published posts need fast published_at lookups
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx
    ON blog_posts (published_at DESC)
    WHERE status = 'published';

CREATE INDEX IF NOT EXISTS blog_posts_created_at_idx
    ON blog_posts (created_at DESC);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blog_tags (
    id         UUID         PRIMARY KEY,
    name       VARCHAR(128) NOT NULL,
    slug       VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Case-insensitive slug uniqueness, consistent with features/amenities tables
CREATE UNIQUE INDEX IF NOT EXISTS blog_tags_slug_lower_key
    ON blog_tags (LOWER(slug));

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES blog_tags(id)  ON DELETE RESTRICT,

    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS blog_post_tags_tag_id_idx
    ON blog_post_tags (tag_id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS blog_post_tags_tag_id_idx;
DROP TABLE IF EXISTS blog_post_tags;

DROP INDEX IF EXISTS blog_tags_slug_lower_key;
DROP TABLE IF EXISTS blog_tags;

DROP INDEX IF EXISTS blog_posts_created_at_idx;
DROP INDEX IF EXISTS blog_posts_published_at_idx;
DROP INDEX IF EXISTS blog_posts_author_id_idx;
DROP INDEX IF EXISTS blog_posts_status_idx;
DROP INDEX IF EXISTS blog_posts_content_path_key;
DROP INDEX IF EXISTS blog_posts_slug_key;
DROP TABLE IF EXISTS blog_posts;

-- +goose StatementEnd
