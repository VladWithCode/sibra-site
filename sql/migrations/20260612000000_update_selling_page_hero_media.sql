-- +goose Up
-- +goose StatementBegin
ALTER TABLE selling_pages
    ADD COLUMN hero_media VARCHAR(256) NOT NULL DEFAULT '',
    ADD COLUMN hero_media_type VARCHAR(8) NOT NULL DEFAULT '';

UPDATE selling_pages
SET
    hero_media = CASE
        WHEN hero_video <> '' THEN hero_video
        WHEN hero_image <> '' THEN hero_image
        ELSE ''
    END,
    hero_media_type = CASE
        WHEN hero_video <> '' THEN 'video'
        WHEN hero_image <> '' THEN 'image'
        ELSE ''
    END;

ALTER TABLE selling_pages
    DROP COLUMN hero_video,
    DROP COLUMN hero_poster,
    DROP COLUMN hero_image;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE selling_pages
    ADD COLUMN hero_video VARCHAR(256) NOT NULL DEFAULT '',
    ADD COLUMN hero_poster VARCHAR(256) NOT NULL DEFAULT '',
    ADD COLUMN hero_image VARCHAR(256) NOT NULL DEFAULT '';

UPDATE selling_pages
SET
    hero_video = CASE WHEN hero_media_type = 'video' THEN hero_media ELSE '' END,
    hero_image = CASE WHEN hero_media_type = 'image' THEN hero_media ELSE '' END;

ALTER TABLE selling_pages
    DROP COLUMN hero_media,
    DROP COLUMN hero_media_type;
-- +goose StatementEnd
