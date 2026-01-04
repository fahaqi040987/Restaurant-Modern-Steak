-- Migration: Add order_id to ingredient_history for order tracking
-- Feature: 007-fix-order-inventory-system
-- Date: 2026-01-03
-- Description: Enables tracking which order triggered ingredient deductions

-- Add order_id column to link deductions to specific orders
ALTER TABLE ingredient_history
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Add index for efficient order-based lookups
CREATE INDEX IF NOT EXISTS idx_ingredient_history_order ON ingredient_history(order_id);

-- Update the operation CHECK constraint to include new operations
-- First, drop the existing constraint if it exists
ALTER TABLE ingredient_history
DROP CONSTRAINT IF EXISTS ingredient_history_operation_check;

-- Add the updated constraint with new operation types
ALTER TABLE ingredient_history
ADD CONSTRAINT ingredient_history_operation_check
CHECK (operation IN ('add', 'remove', 'restock', 'usage', 'spoilage',
                     'adjustment', 'order_consumption', 'order_cancellation'));

-- Add comment for documentation
COMMENT ON COLUMN ingredient_history.order_id IS 'Reference to the order that triggered this stock change (for order_consumption and order_cancellation operations)';
