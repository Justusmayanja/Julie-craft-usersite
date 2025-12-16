-- =====================================================
-- HERO CAROUSEL SLIDES TABLE
-- =====================================================
-- Table for storing dynamic carousel slides for the homepage hero section

CREATE TABLE IF NOT EXISTS carousel_slides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Slide Content
    image_url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    cta_text VARCHAR(100),
    cta_link VARCHAR(255),
    
    -- Display Settings
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carousel_slides_active ON carousel_slides(is_active);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_sort_order ON carousel_slides(sort_order);
CREATE INDEX IF NOT EXISTS idx_carousel_slides_active_sort ON carousel_slides(is_active, sort_order);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_carousel_slides_updated_at ON carousel_slides;
CREATE TRIGGER update_carousel_slides_updated_at
    BEFORE UPDATE ON carousel_slides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default carousel slides (only if no records exist)
INSERT INTO carousel_slides (
    image_url,
    title,
    subtitle,
    description,
    cta_text,
    cta_link,
    is_active,
    sort_order
) VALUES
(
    '/traditional-wall-hanging-african-textile-patterns.jpg',
    'Traditional Wall Hangings',
    'Handcrafted Heritage',
    'Beautiful handwoven wall hangings featuring authentic African patterns that bring cultural elegance to any space.',
    'Shop Wall Hangings',
    '/products?category=wall-hangings',
    TRUE,
    1
),
(
    '/colorful-african-beaded-jewelry-display-vibrant.jpg',
    'Vibrant Beaded Jewelry',
    'Colors of Africa',
    'Stunning handmade jewelry featuring traditional African beadwork and contemporary designs that tell a story.',
    'Explore Jewelry',
    '/products?category=jewelry',
    TRUE,
    2
),
(
    '/traditional-door-mats-woven-natural-materials.jpg',
    'Handwoven Door Mats',
    'Welcome with Style',
    'Durable and beautiful door mats crafted from natural materials using traditional weaving techniques.',
    'View Door Mats',
    '/products?category=door-mats',
    TRUE,
    3
),
(
    '/wooden-african-sculptures-carvings-craftsmanship.jpg',
    'Masterful Wood Carvings',
    'Carved Perfection',
    'Exquisite wooden sculptures and functional pieces that showcase the incredible skill of Ugandan woodworkers.',
    'See Wood Crafts',
    '/products?category=wood',
    TRUE,
    4
),
(
    '/sitting-room-traditional-mats-african-patterns.jpg',
    'Traditional Sitting Room Mats',
    'Comfort & Culture',
    'Transform your living space with authentic traditional mats featuring intricate patterns and natural materials.',
    'Shop Traditional Mats',
    '/products?category=traditional-mats',
    TRUE,
    5
)
ON CONFLICT DO NOTHING;

