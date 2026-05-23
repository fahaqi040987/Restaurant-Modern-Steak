-- Migration: Create bio_link_profile, bio_links, and bio_link_clicks tables
-- Purpose: Custom "Link in Bio" landing page for social media traffic

-- Profile table (singleton pattern, same as restaurant_info)
CREATE TABLE IF NOT EXISTS bio_link_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name VARCHAR(100) NOT NULL,
    bio_text TEXT,
    avatar_url VARCHAR(500),
    theme_color VARCHAR(7) DEFAULT '#e5612f',
    noindex BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_bio_link_profile_singleton ON bio_link_profile ((TRUE));

INSERT INTO bio_link_profile (account_name, bio_text)
VALUES ('Steak Kenangan', 'Premium steaks crafted with passion');

-- Link items table
CREATE TABLE IF NOT EXISTS bio_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bio_links_is_active ON bio_links(is_active);
CREATE INDEX idx_bio_links_sort_order ON bio_links(sort_order);

-- Click analytics table
CREATE TABLE IF NOT EXISTS bio_link_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES bio_links(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    referrer VARCHAR(500),
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bio_link_clicks_link_id ON bio_link_clicks(link_id);
CREATE INDEX idx_bio_link_clicks_clicked_at ON bio_link_clicks(clicked_at);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_bio_link_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bio_link_profile_updated_at
    BEFORE UPDATE ON bio_link_profile
    FOR EACH ROW EXECUTE FUNCTION update_bio_link_updated_at();

CREATE TRIGGER trg_bio_links_updated_at
    BEFORE UPDATE ON bio_links
    FOR EACH ROW EXECUTE FUNCTION update_bio_link_updated_at();
