-- Migration: Add QR code column to dining_tables for customer self-ordering
-- Created: 2025-12-22

-- Add qr_code column for table identification via QR scan
ALTER TABLE dining_tables ADD COLUMN IF NOT EXISTS qr_code VARCHAR(50) UNIQUE;

-- Create index for fast QR code lookups
CREATE INDEX IF NOT EXISTS idx_dining_tables_qr_code ON dining_tables(qr_code) WHERE qr_code IS NOT NULL;

-- Update existing tables with auto-generated QR codes based on table_number
UPDATE dining_tables 
SET qr_code = LOWER(REPLACE(table_number, ' ', '-')) || '-' || SUBSTRING(id::text, 1, 8)
WHERE qr_code IS NULL;
