-- +goose Up
-- +goose StatementBegin
-- Enable required extensions for earthdistance
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY,
    address VARCHAR(256) NOT NULL,
    description VARCHAR(512) DEFAULT '',
    city VARCHAR(128) NOT NULL,
    state VARCHAR(128) NOT NULL,
    zip VARCHAR(5) DEFAULT '',
    nb_hood VARCHAR(128) DEFAULT '',
    country VARCHAR(128) DEFAULT '',
    price NUMERIC(12,4) DEFAULT CAST(0.0 as NUMERIC),
    property_type VARCHAR(128) NOT NULL,
    contract VARCHAR(16) NOT NULL,
    beds INT NOT NULL,
    baths INT NOT NULL,
    square_mt REAL NOT NULL,
    lot_size REAL NOT NULL,
    listing_date DATE DEFAULT NOW(),
    year_built INT DEFAULT 0,
    status VARCHAR(64) NOT NULL,
    lat DOUBLE PRECISION DEFAULT 0.0,
    lon DOUBLE PRECISION DEFAULT 0.0,
    earth_coords POINT, -- New earthdistance column
    featured_started_at TIMESTAMPTZ,
    featured_expires_at TIMESTAMPTZ,
    main_img VARCHAR(256) DEFAULT '',
    imgs VARCHAR(256)[],
    agent UUID NOT NULL,
    slug VARCHAR(512),
    features JSONB,

    FOREIGN KEY (agent) REFERENCES users(id)
);

-- Create the function to update earth_coords
CREATE OR REPLACE FUNCTION update_earth_coords()
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

-- Create the trigger
CREATE TRIGGER trigger_update_earth_coords
    BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_earth_coords();

-- Update existing records to populate earth_coords from lat/lon
UPDATE properties
SET earth_coords = point(lon, lat)
WHERE lat IS NOT NULL AND lon IS NOT NULL AND lat != 0 AND lon != 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_earth_coords ON properties USING gist (earth_coords);
CREATE INDEX IF NOT EXISTS idx_properties_lat_lon ON properties (lat, lon);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties (state);
CREATE INDEX IF NOT EXISTS idx_properties_contract ON properties (contract);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_beds ON properties (beds);
CREATE INDEX IF NOT EXISTS idx_properties_baths ON properties (baths);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties (featured);
CREATE INDEX IF NOT EXISTS idx_properties_listing_date ON properties (listing_date);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties USING gin(
    to_tsvector('spanish',
        address || ' ' || description || ' ' || city || ' ' || state || ' ' ||
        zip || ' ' || property_type || ' ' || contract || ' ' || nb_hood
    )
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Remove the trigger
DROP TRIGGER IF EXISTS trigger_update_earth_coords ON properties;

-- Remove the function
DROP FUNCTION IF EXISTS update_earth_coords();

-- Remove indexes (optional, might want to keep some)
DROP INDEX IF EXISTS idx_properties_earth_coords;
DROP INDEX IF EXISTS idx_properties_search;

-- Remove the earth_coords column
ALTER TABLE properties DROP COLUMN IF EXISTS earth_coords;

-- Drop extensions (be very careful with this in production!)
-- Only uncomment if you're sure no other tables use these extensions
-- DROP EXTENSION IF EXISTS earthdistance;
-- DROP EXTENSION IF EXISTS cube;
-- +goose StatementEnd
