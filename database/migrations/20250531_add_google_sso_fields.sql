-- File: database/migrations/20250531_add_google_sso_fields.sql
-- Add Google SSO fields to users table

BEGIN;

ALTER TABLE users
  ADD COLUMN google_id UUID UNIQUE,
  ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN rejection_count INTEGER DEFAULT 0,
  ADD COLUMN last_rejection_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN google_linked_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_approval_status ON users(approval_status);
CREATE INDEX idx_users_last_rejection ON users(last_rejection_at) WHERE last_rejection_at IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN users.google_id IS 'Unique identifier from Google OAuth (UUID format derived from Google sub)';
COMMENT ON COLUMN users.approval_status IS 'Approval status for Google SSO users: pending, approved, or rejected';
COMMENT ON COLUMN users.rejection_count IS 'Number of times this user has been rejected';
COMMENT ON COLUMN users.last_rejection_at IS 'Timestamp of most recent rejection for cooldown calculation';
COMMENT ON COLUMN users.google_linked_at IS 'When the Google account was linked to this user';

-- Update existing admin users to be approved
UPDATE users
SET approval_status = 'approved'
WHERE role = 'admin' AND approval_status = 'pending';

COMMIT;
