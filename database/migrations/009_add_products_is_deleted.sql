-- Migration: Add is_deleted column to products table for soft delete functionality
-- This allows products that have been used in orders to be "deleted" while preserving order history

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for filtering out deleted products
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);

-- Update any existing products to ensure is_deleted is false
UPDATE products SET is_deleted = FALSE WHERE is_deleted IS NULL;
