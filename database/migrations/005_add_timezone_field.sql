-- Migration: Add timezone field to restaurant_info table
-- Description: Allows dynamic timezone display (WIB/WITA/WIT) based on restaurant location
-- Date: 2025-01-18

-- Add timezone column to restaurant_info table
ALTER TABLE restaurant_info
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Jakarta';

-- Add comment for documentation
COMMENT ON COLUMN restaurant_info.timezone IS 'IANA timezone identifier (e.g., Asia/Jakarta, Asia/Makassar, Asia/Jayapura)';

-- Update existing records to have default timezone
UPDATE restaurant_info
SET timezone = 'Asia/Jakarta'
WHERE timezone IS NULL;

-- Verify the migration
SELECT
    id,
    name,
    timezone,
    created_at,
    updated_at
FROM restaurant_info;
