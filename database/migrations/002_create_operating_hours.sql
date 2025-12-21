-- Migration: Create operating_hours table
-- Description: Stores operating hours for each day of the week

-- Up Migration
CREATE TABLE IF NOT EXISTS operating_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_info_id UUID NOT NULL REFERENCES restaurant_info(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: Only one entry per day of week per restaurant
CREATE UNIQUE INDEX IF NOT EXISTS idx_operating_hours_day_unique
    ON operating_hours (restaurant_info_id, day_of_week);

-- Index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_operating_hours_restaurant_id
    ON operating_hours (restaurant_info_id);

-- Trigger for updated_at
CREATE TRIGGER update_operating_hours_updated_at
    BEFORE UPDATE ON operating_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Down Migration (for rollback)
-- DROP TRIGGER IF EXISTS update_operating_hours_updated_at ON operating_hours;
-- DROP INDEX IF EXISTS idx_operating_hours_day_unique;
-- DROP INDEX IF EXISTS idx_operating_hours_restaurant_id;
-- DROP TABLE IF EXISTS operating_hours;
