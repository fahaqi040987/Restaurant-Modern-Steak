-- Migration to enhance ingredients table for logistics system
-- Adds code, category, storage_location, and lead_time_days fields

-- Add new columns to ingredients table
ALTER TABLE ingredients
ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'Lainnya',
ADD COLUMN IF NOT EXISTS storage_location VARCHAR(50) DEFAULT 'Dry Storage',
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 0;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_storage_location ON ingredients(storage_location);
CREATE INDEX IF NOT EXISTS idx_ingredients_code ON ingredients(code);

-- Add comments for documentation
COMMENT ON COLUMN ingredients.code IS 'Barcode or internal code for the ingredient';
COMMENT ON COLUMN ingredients.category IS 'Category: Daging, Seafood, Sayur, Buah, Bumbu, Bahan Kering, Minuman, Dairy, Minyak, Lainnya';
COMMENT ON COLUMN ingredients.storage_location IS 'Storage location: Chiller, Freezer, Dry Storage, Rack, Bar, Lainnya';
COMMENT ON COLUMN ingredients.lead_time_days IS 'Lead time in days from default supplier';

-- Update unit CHECK constraint with more units
ALTER TABLE ingredients
DROP CONSTRAINT ingredients_unit_check;

ALTER TABLE ingredients
ADD CONSTRAINT ingredients_unit_check
CHECK (unit IN ('kg', 'gram', 'liter', 'ml', 'pcs', 'pack', 'box', 'buah', 'ikat', 'ons', 'pon'));

-- Update ingredient_stock_history to support more movement reasons
ALTER TABLE ingredient_stock_history
DROP CONSTRAINT IF EXISTS ingredient_stock_history_type_check;

ALTER TABLE ingredient_stock_history
ADD CONSTRAINT ingredient_stock_history_type_check
CHECK (type IN ('purchase', 'spoilage', 'damage', 'expired', 'theft', 'stock_opname', 'manual_adjustment', 'recipe_usage', 'restock'));
