-- =====================================================
-- SITE CONTENT MANAGEMENT TABLES
-- =====================================================
-- Tables for managing dynamic content on the user-facing site

-- Site Pages Table
CREATE TABLE IF NOT EXISTS site_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT,
    excerpt TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('page', 'homepage', 'about', 'contact', 'privacy', 'terms', 'legal', 'custom')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    template VARCHAR(50) DEFAULT 'default',
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT[],
    featured_image TEXT,
    author_id UUID,
    sort_order INTEGER DEFAULT 0,
    is_homepage BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Homepage Sections Table
CREATE TABLE IF NOT EXISTS homepage_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_type VARCHAR(50) NOT NULL CHECK (section_type IN (
        'hero', 
        'featured_products', 
        'categories', 
        'about_preview', 
        'testimonials', 
        'newsletter', 
        'gallery',
        'banner',
        'text_block',
        'image_text',
        'custom'
    )),
    title VARCHAR(255) NOT NULL,
    content JSONB DEFAULT '{}'::jsonb, -- Flexible JSON structure for section-specific content
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    display_settings JSONB DEFAULT '{}'::jsonb, -- Layout, colors, spacing, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site Settings Table (extends business_settings)
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB DEFAULT '{}'::jsonb,
    setting_type VARCHAR(50) DEFAULT 'general' CHECK (setting_type IN (
        'general',
        'footer',
        'header',
        'navigation',
        'social',
        'contact',
        'seo',
        'appearance',
        'custom'
    )),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Footer Content Table
CREATE TABLE IF NOT EXISTS footer_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section VARCHAR(50) NOT NULL CHECK (section IN ('brand', 'links', 'categories', 'contact', 'social', 'copyright')),
    content JSONB DEFAULT '{}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation Items Table
CREATE TABLE IF NOT EXISTS navigation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    href VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_external BOOLEAN DEFAULT FALSE,
    target VARCHAR(20) DEFAULT '_self' CHECK (target IN ('_self', '_blank')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON site_pages(slug);
CREATE INDEX IF NOT EXISTS idx_site_pages_type ON site_pages(type);
CREATE INDEX IF NOT EXISTS idx_site_pages_status ON site_pages(status);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_type ON homepage_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_active ON homepage_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_order ON homepage_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_type ON site_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_footer_content_section ON footer_content(section);
CREATE INDEX IF NOT EXISTS idx_navigation_items_parent ON navigation_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_navigation_items_active ON navigation_items(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_site_pages_updated_at
    BEFORE UPDATE ON site_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homepage_sections_updated_at
    BEFORE UPDATE ON homepage_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_footer_content_updated_at
    BEFORE UPDATE ON footer_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navigation_items_updated_at
    BEFORE UPDATE ON navigation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default site settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('site_name', '"Julie Crafts"', 'general', 'Site name'),
    ('site_tagline', '"Authentic Handmade Crafts"', 'general', 'Site tagline'),
    ('logo_url', '"/julie-logo.jpeg"', 'appearance', 'Site logo URL'),
    ('contact_email', '"hello@juliecrafts.ug"', 'contact', 'Contact email'),
    ('contact_phone', '"+256 700 123 456"', 'contact', 'Contact phone'),
    ('contact_address', '"Ntinda View Apartments, Kampala"', 'contact', 'Contact address'),
    ('facebook_url', '""', 'social', 'Facebook page URL'),
    ('instagram_url', '""', 'social', 'Instagram profile URL'),
    ('twitter_url', '""', 'social', 'Twitter profile URL'),
    ('youtube_url', '""', 'social', 'YouTube channel URL')
ON CONFLICT (setting_key) DO NOTHING;

