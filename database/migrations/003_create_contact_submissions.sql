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
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
    ON contact_submissions (created_at DESC);

-- Index for filtering unread submissions
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read
    ON contact_submissions (is_read);

-- Down Migration (for rollback)
-- DROP INDEX IF EXISTS idx_contact_submissions_is_read;
-- DROP INDEX IF EXISTS idx_contact_submissions_created_at;
-- DROP TABLE IF EXISTS contact_submissions;
