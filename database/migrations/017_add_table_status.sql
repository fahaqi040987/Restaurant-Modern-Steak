-- Migration: Add manual status tracking to dining tables
-- Feature: Clarify table status (available/occupied/reserved/maintenance)
-- Date: 2026-09-20
--
-- `status` holds the MANUAL out-of-service state set by staff
-- (reserved / maintenance). Occupancy itself stays order-driven via
-- is_occupied. Effective status shown in the UI:
--   maintenance > reserved > occupied (is_occupied) > available
-- `status_note` explains WHY a table is reserved or under maintenance.

ALTER TABLE dining_tables
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'available';

ALTER TABLE dining_tables
ADD CONSTRAINT dining_tables_status_check
CHECK (status IN ('available', 'reserved', 'maintenance'));

ALTER TABLE dining_tables
ADD COLUMN IF NOT EXISTS status_note VARCHAR(200);

COMMENT ON COLUMN dining_tables.status IS 'Manual state: available, reserved or maintenance. Occupancy is tracked separately by is_occupied.';
COMMENT ON COLUMN dining_tables.status_note IS 'Reason for the reserved/maintenance state (shown as indicator in the UI).';
