-- Migration: Create contact_submissions table
-- Description: Stores contact form submissions from the public website

-- Up Migration
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
    ON contact_submissions (created_at DESC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status
    ON contact_submissions (status);

-- Trigger for updated_at
CREATE TRIGGER update_contact_submissions_updated_at
    BEFORE UPDATE ON contact_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Down Migration (for rollback)
-- DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON contact_submissions;
-- DROP INDEX IF EXISTS idx_contact_submissions_status;
-- DROP INDEX IF EXISTS idx_contact_submissions_created_at;
-- DROP TABLE IF EXISTS contact_submissions;
