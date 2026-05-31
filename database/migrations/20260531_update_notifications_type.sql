-- Migration: Update notifications type constraint to include user approval types
-- Description: Adds 'user_approved' and 'user_rejected' to the allowed types for notifications

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with all required types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('order_update', 'low_stock', 'payment', 'system_alert', 'daily_report', 'user_approved', 'user_rejected'));
