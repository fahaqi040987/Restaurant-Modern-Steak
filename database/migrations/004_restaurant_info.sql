-- Migration: Restaurant Info and Operating Hours Tables
-- Description: Add tables for public website restaurant information

-- Restaurant Information Table
CREATE TABLE IF NOT EXISTS restaurant_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Steak Kenangan',
    tagline VARCHAR(255) DEFAULT 'Premium Indonesian Steakhouse',
    description TEXT,
    address VARCHAR(500),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(100),
    whatsapp VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    logo_url VARCHAR(500),
    hero_image_url VARCHAR(500),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),
    twitter_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Operating Hours Table
CREATE TABLE IF NOT EXISTS operating_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(day_of_week)
);

-- Insert default restaurant info
INSERT INTO restaurant_info (
    name, 
    tagline, 
    description, 
    address, 
    city, 
    postal_code,
    phone, 
    email, 
    whatsapp,
    latitude,
    longitude,
    instagram_url
) VALUES (
    'Steak Kenangan',
    'Premium Indonesian Steakhouse',
    'Steak Kenangan adalah restoran steakhouse premium yang menggabungkan cita rasa Indonesia dengan kualitas daging internasional terbaik. Kami menghadirkan pengalaman bersantap yang tak terlupakan dengan menu signature seperti Rendang Wagyu Steak dan Sate Wagyu Premium.',
    'Jl. Sudirman No. 123',
    'Jakarta Selatan',
    '12190',
    '+62 21 1234 5678',
    'info@steakkenangan.id',
    '+62 812 3456 7890',
    -6.2088,
    106.8456,
    'https://instagram.com/steakkenangan'
) ON CONFLICT DO NOTHING;

-- Insert default operating hours (Monday to Sunday)
INSERT INTO operating_hours (day_of_week, open_time, close_time, is_closed) VALUES
    (0, '11:00:00', '22:00:00', FALSE), -- Sunday
    (1, '11:00:00', '22:00:00', FALSE), -- Monday
    (2, '11:00:00', '22:00:00', FALSE), -- Tuesday
    (3, '11:00:00', '22:00:00', FALSE), -- Wednesday
    (4, '11:00:00', '22:00:00', FALSE), -- Thursday
    (5, '11:00:00', '23:00:00', FALSE), -- Friday
    (6, '11:00:00', '23:00:00', FALSE)  -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_operating_hours_day ON operating_hours(day_of_week);

-- Add updated_at trigger for restaurant_info
CREATE OR REPLACE FUNCTION update_restaurant_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_restaurant_info_updated_at
    BEFORE UPDATE ON restaurant_info
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurant_info_updated_at();

-- Add updated_at trigger for operating_hours
CREATE OR REPLACE FUNCTION update_operating_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_operating_hours_updated_at
    BEFORE UPDATE ON operating_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_operating_hours_updated_at();
