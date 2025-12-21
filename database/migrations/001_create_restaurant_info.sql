-- Migration: Create restaurant_info table
-- Description: Stores singleton restaurant configuration for the public website

-- Up Migration
CREATE TABLE IF NOT EXISTS restaurant_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    tagline VARCHAR(200),
    description TEXT,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(50),
    map_latitude DECIMAL(10, 8),
    map_longitude DECIMAL(11, 8),
    google_maps_url VARCHAR(500),
    instagram_url VARCHAR(255),
    facebook_url VARCHAR(255),
    twitter_url VARCHAR(255),
    logo_url VARCHAR(500),
    hero_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Singleton constraint: Ensure only one row can exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurant_info_singleton ON restaurant_info ((true));

-- Trigger for updated_at
CREATE TRIGGER update_restaurant_info_updated_at
    BEFORE UPDATE ON restaurant_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Down Migration (for rollback)
-- DROP TRIGGER IF EXISTS update_restaurant_info_updated_at ON restaurant_info;
-- DROP INDEX IF EXISTS idx_restaurant_info_singleton;
-- DROP TABLE IF EXISTS restaurant_info;
