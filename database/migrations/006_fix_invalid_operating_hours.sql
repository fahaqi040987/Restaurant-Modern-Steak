-- Migration: Fix invalid operating hours where open_time = close_time = 00:00:00
-- Description: Updates invalid midnight-to-midnight time ranges to sensible defaults
-- Date: 2025-01-18

-- Fix Monday-Friday (days 1-5): Set to 11:00 - 22:00 (11 AM - 10 PM)
UPDATE operating_hours
SET
  open_time = '11:00:00',
  close_time = '22:00:00',
  is_closed = false
WHERE day_of_week BETWEEN 1 AND 5
AND open_time = '00:00:00'
AND close_time = '00:00:00'
AND is_closed = false;

-- Fix Saturday (day 6): Set to 10:00 - 23:00 (10 AM - 11 PM)
UPDATE operating_hours
SET
  open_time = '10:00:00',
  close_time = '23:00:00',
  is_closed = false
WHERE day_of_week = 6
AND open_time = '00:00:00'
AND close_time = '00:00:00'
AND is_closed = false;

-- Fix Sunday (day 0): Mark as closed
UPDATE operating_hours
SET
  is_closed = true
WHERE day_of_week = 0
AND open_time = '00:00:00'
AND close_time = '00:00:00'
AND is_closed = false;

-- Verify the changes
SELECT
  day_of_week,
  open_time,
  close_time,
  is_closed,
  created_at,
  updated_at
FROM operating_hours
ORDER BY day_of_week;
