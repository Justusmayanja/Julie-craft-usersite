-- =====================================================
-- ABOUT PAGE CONTENT TABLE
-- =====================================================
-- Table for storing dynamic content for the About Us page

CREATE TABLE IF NOT EXISTS about_page_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Hero Section
    hero_badge_text VARCHAR(100) DEFAULT 'Our Story',
    hero_title_line1 VARCHAR(255),
    hero_title_line2 VARCHAR(255),
    hero_description TEXT,
    hero_cta_primary_text VARCHAR(100) DEFAULT 'Explore Our Crafts',
    hero_cta_primary_link VARCHAR(255) DEFAULT '/products',
    hero_cta_secondary_text VARCHAR(100) DEFAULT 'Get in Touch',
    hero_cta_secondary_link VARCHAR(255) DEFAULT '/contact',
    
    -- Founder Story Section
    founder_name VARCHAR(255),
    founder_title VARCHAR(255),
    founder_image_url TEXT,
    founder_story_paragraph1 TEXT,
    founder_story_paragraph2 TEXT,
    founder_story_paragraph3 TEXT,
    founder_cta_text VARCHAR(100) DEFAULT 'Connect With Us',
    founder_cta_link VARCHAR(255) DEFAULT '/contact',
    
    -- Values Section
    values_title VARCHAR(255) DEFAULT 'Our Core Values',
    values_subtitle TEXT,
    values_content JSONB DEFAULT '[]'::jsonb, -- Array of {icon, title, description, color, bgColor}
    
    -- Achievements Section
    achievements_title VARCHAR(255) DEFAULT 'Making a Difference',
    achievements_subtitle TEXT,
    achievements_content JSONB DEFAULT '[]'::jsonb, -- Array of {number, label, icon}
    
    -- Process Section
    process_title VARCHAR(255) DEFAULT 'How We Work',
    process_subtitle TEXT,
    process_content JSONB DEFAULT '[]'::jsonb, -- Array of {step, title, description, icon}
    
    -- Awards Section
    awards_title VARCHAR(255) DEFAULT 'Awards & Recognition',
    awards_subtitle TEXT,
    awards_content JSONB DEFAULT '[]'::jsonb, -- Array of {icon, title, subtitle, description}
    
    -- Call to Action Section
    cta_title VARCHAR(255) DEFAULT 'Join Our Mission',
    cta_description TEXT,
    cta_primary_text VARCHAR(100) DEFAULT 'Browse Our Crafts',
    cta_primary_link VARCHAR(255) DEFAULT '/products',
    cta_secondary_text VARCHAR(100) DEFAULT 'Contact Us',
    cta_secondary_link VARCHAR(255) DEFAULT '/contact',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_about_page_content_active ON about_page_content(is_active);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_about_page_content_updated_at ON about_page_content;
CREATE TRIGGER update_about_page_content_updated_at
    BEFORE UPDATE ON about_page_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default content (only if no record exists)
INSERT INTO about_page_content (
    hero_badge_text,
    hero_title_line1,
    hero_title_line2,
    hero_description,
    founder_name,
    founder_title,
    founder_image_url,
    founder_story_paragraph1,
    founder_story_paragraph2,
    founder_story_paragraph3,
    values_title,
    values_subtitle,
    achievements_title,
    achievements_subtitle,
    process_title,
    process_subtitle,
    awards_title,
    awards_subtitle,
    cta_title,
    cta_description
) VALUES (
    'Our Story',
    'Celebrating Uganda''s Rich',
    'Craft Heritage',
    'Julie Crafts was born from a passion for preserving traditional Ugandan artistry while supporting local communities. We bridge the gap between skilled artisans and craft enthusiasts worldwide.',
    'Juliet Nnyonyozi',
    'Founder & CEO, Julie Crafts',
    '/young-african-woman-weaving-traditional-mat.jpg',
    'Growing up in Kampala, I was surrounded by the incredible artistry of Ugandan craftspeople. My grandmother was a skilled weaver, and watching her work sparked my lifelong appreciation for traditional crafts.',
    'After studying business and traveling the world, I realized how unique and valuable our local crafts are. In 2009, I founded Julie Crafts to create a sustainable platform that celebrates our artisans while sharing their beautiful work with the world.',
    'Today, we work with over 500 artisans across Uganda, ensuring they receive fair compensation while preserving traditional techniques for future generations. Every purchase supports not just an artisan, but an entire community.',
    'Our Core Values',
    'These core values guide everything we do, from selecting artisan partners to delivering your order.',
    'Making a Difference',
    'Over the years, we''ve built a thriving ecosystem that benefits artisans, communities, and customers alike.',
    'How We Work',
    'Our process ensures quality, authenticity, and fair trade practices at every step.',
    'Awards & Recognition',
    'We''re honored to be recognized for our commitment to artisan communities and cultural preservation.',
    'Join Our Mission',
    'Every purchase supports Ugandan artisans and helps preserve traditional crafts for future generations. Discover authentic pieces that tell a story.'
)
ON CONFLICT DO NOTHING;

