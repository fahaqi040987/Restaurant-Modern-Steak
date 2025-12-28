-- Migration: Alter contact_submissions table to use status instead of is_read
-- Description: Updates contact_submissions table to support status workflow

-- Up Migration
-- Add new columns if they don't exist
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new';
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add check constraint for status values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'contact_submissions_status_check'
    ) THEN
        ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_status_check
            CHECK (status IN ('new', 'in_progress', 'resolved', 'spam'));
    END IF;
END $$;

-- Migrate existing data: convert is_read to status
UPDATE contact_submissions SET status = 'resolved' WHERE is_read = true AND status IS NULL;
UPDATE contact_submissions SET status = 'new' WHERE status IS NULL;

-- Drop old columns if they exist
ALTER TABLE contact_submissions DROP COLUMN IF EXISTS is_read;
ALTER TABLE contact_submissions DROP COLUMN IF EXISTS read_at;

-- Drop old index and create new one
DROP INDEX IF EXISTS idx_contact_submissions_is_read;
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions (status);

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON contact_submissions;
CREATE TRIGGER update_contact_submissions_updated_at
    BEFORE UPDATE ON contact_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Down Migration (for rollback)
-- ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
-- ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
-- UPDATE contact_submissions SET is_read = (status = 'resolved');
-- ALTER TABLE contact_submissions DROP COLUMN IF EXISTS status;
-- ALTER TABLE contact_submissions DROP COLUMN IF EXISTS updated_at;
-- DROP INDEX IF EXISTS idx_contact_submissions_status;
-- CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read ON contact_submissions (is_read);
