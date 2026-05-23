-- Migration: Add background_url column to bio_link_profile
ALTER TABLE bio_link_profile ADD COLUMN IF NOT EXISTS background_url VARCHAR(500);
