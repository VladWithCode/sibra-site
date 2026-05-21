-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS team_members (
    id         UUID PRIMARY KEY,
    name       VARCHAR(128) NOT NULL,
    role       VARCHAR(128) NOT NULL DEFAULT '',
    bio        TEXT         NOT NULL DEFAULT '',
    photo_url  TEXT         NOT NULL DEFAULT '',
    position   INT          NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS team_members_position_idx ON team_members (position);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS team_members_position_idx;
DROP TABLE IF EXISTS team_members;
-- +goose StatementEnd
