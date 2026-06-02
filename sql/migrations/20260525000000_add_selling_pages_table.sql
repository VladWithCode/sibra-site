-- +goose Up
-- +goose StatementBegin
CREATE TABLE selling_pages (
    id UUID PRIMARY KEY,
    slug VARCHAR(256) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    variant VARCHAR(8) NOT NULL DEFAULT 'right'
        CHECK (variant IN ('left', 'center', 'right')),
    published BOOLEAN NOT NULL DEFAULT false,

    -- SEO / tracking
    seo_title VARCHAR(200) NOT NULL DEFAULT '',
    seo_description TEXT NOT NULL DEFAULT '',
    pixel_id VARCHAR(64) NOT NULL DEFAULT '',
    whatsapp_number VARCHAR(20) NOT NULL DEFAULT '',
    whatsapp_message TEXT NOT NULL DEFAULT '',

    -- Hero
    hero_video VARCHAR(256) NOT NULL DEFAULT '',
    hero_poster VARCHAR(256) NOT NULL DEFAULT '',
    hero_image VARCHAR(256) NOT NULL DEFAULT '',
    hero_title VARCHAR(200) NOT NULL DEFAULT '',
    hero_subtitle TEXT NOT NULL DEFAULT '',
    hero_cta_label VARCHAR(80) NOT NULL DEFAULT '',
    hero_cta_target VARCHAR(256) NOT NULL DEFAULT '',

    -- Availability
    availability_img VARCHAR(256) NOT NULL DEFAULT '',
    availability_cta_url VARCHAR(256) NOT NULL DEFAULT '',

    -- Contact
    contact_bg_img VARCHAR(256) NOT NULL DEFAULT '',
    contact_heading VARCHAR(200) NOT NULL DEFAULT '',

    -- Financing
    financing_heading VARCHAR(200) NOT NULL DEFAULT '',
    financing_body TEXT NOT NULL DEFAULT '',
    financing_img VARCHAR(256) NOT NULL DEFAULT '',

    -- Offer
    offer_price VARCHAR(40) NOT NULL DEFAULT '',
    offer_period VARCHAR(40) NOT NULL DEFAULT '',
    offer_dimensions VARCHAR(60) NOT NULL DEFAULT '',
    offer_fine_print TEXT NOT NULL DEFAULT '',
    offer_land_img VARCHAR(256) NOT NULL DEFAULT '',
    offer_features JSONB,

    -- Cards / Steps (repeating)
    cards JSONB,
    steps JSONB,

    -- Location
    location_img VARCHAR(256) NOT NULL DEFAULT '',
    location_map_embed TEXT NOT NULL DEFAULT '',
    location_caption TEXT NOT NULL DEFAULT '',
    location_chips JSONB,

    -- Footer-contact
    contact_address VARCHAR(256) NOT NULL DEFAULT '',
    contact_hours VARCHAR(120) NOT NULL DEFAULT '',
    contact_phone VARCHAR(20) NOT NULL DEFAULT '',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS selling_pages;
-- +goose StatementEnd
