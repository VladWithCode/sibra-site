-- +goose Up
-- +goose StatementBegin
-- Enable required extensions for earthdistance
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

CREATE TABLE IF NOT EXISTS properties (
    id uuid PRIMARY KEY,
    address varchar(256) NOT NULL,
    description varchar(512) DEFAULT '',
    city varchar(128) NOT NULL,
    state varchar(128) NOT NULL,
    zip varchar(5) DEFAULT '',
    nb_hood varchar(128) DEFAULT '',
    country varchar(128) DEFAULT '',
    price NUMERIC(12,4) DEFAULT CAST(0.0 as NUMERIC),
    property_type varchar(128) NOT NULL,
    contract varchar(16) NOT NULL,
    beds int NOT NULL,
    baths int NOT NULL,
    square_mt real NOT NULL,
    lot_size real NOT NULL,
    listing_date date DEFAULT NOW(),
    year_built int DEFAULT 0,
    status varchar(64) NOT NULL,
    lat DOUBLE PRECISION DEFAULT 0.0,
    lon DOUBLE PRECISION DEFAULT 0.0,
    earth_coords POINT, -- New earthdistance column
    featured bool DEFAULT false,
    featured_expires_at timestamp with time zone DEFAULT NOW(),
    main_img varchar(256) DEFAULT '',
    imgs varchar(256)[],
    agent uuid NOT NULL,
    slug varchar(512),
    features jsonb,

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
