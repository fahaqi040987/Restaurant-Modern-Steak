-- Migration: 20251231_120000_create_reservations_table.sql
-- Feature: 004-restaurant-management (Public Website Integration)
-- Description: Create reservations table for customer table bookings

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    party_size INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    special_requests TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_party_size CHECK (party_size > 0 AND party_size <= 20),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);

-- Create updated_at trigger (uses existing function if available)
DO $$
BEGIN
    -- Check if the function exists, create if not
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
    END IF;
END$$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_reservations_updated_at ON reservations;
CREATE TRIGGER set_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE reservations IS 'Customer table reservations submitted through the public website';
COMMENT ON COLUMN reservations.status IS 'Reservation status: pending, confirmed, cancelled, completed, no_show';
COMMENT ON COLUMN reservations.confirmed_by IS 'Staff member who confirmed the reservation (nullable for pending)';
