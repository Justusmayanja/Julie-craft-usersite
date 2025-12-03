-- =====================================================
-- Archive Functionality Migration
-- Adds archive support to orders, products, customers, and blog posts
-- =====================================================

-- Add is_archived column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_is_archived ON orders(is_archived);

-- Add archived_at timestamp for orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add is_archived column to products table (if not already exists as status)
-- Products already have status field, but we'll add is_archived for explicit archiving
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add is_archived column to profiles (customers) table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_archived ON profiles(is_archived);

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add is_archived column to blog_posts table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
        ALTER TABLE blog_posts 
        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
        
        CREATE INDEX IF NOT EXISTS idx_blog_posts_is_archived ON blog_posts(is_archived);
        
        ALTER TABLE blog_posts 
        ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add is_archived column to notifications table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
        
        CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON notifications(is_archived);
        
        ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create function to archive old delivered orders (older than 90 days)
CREATE OR REPLACE FUNCTION archive_old_orders()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE orders
    SET 
        is_archived = true,
        archived_at = NOW()
    WHERE 
        status = 'delivered' 
        AND is_archived = false
        AND delivered_date < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to archive old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION archive_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        UPDATE notifications
        SET 
            is_archived = true,
            archived_at = NOW()
        WHERE 
            is_archived = false
            AND created_at < NOW() - INTERVAL '30 days';
        
        GET DIAGNOSTICS archived_count = ROW_COUNT;
        RETURN archived_count;
    END IF;
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON COLUMN orders.is_archived IS 'Indicates if the order has been archived';
COMMENT ON COLUMN orders.archived_at IS 'Timestamp when the order was archived';
COMMENT ON COLUMN products.is_archived IS 'Indicates if the product has been archived';
COMMENT ON COLUMN products.archived_at IS 'Timestamp when the product was archived';
COMMENT ON COLUMN profiles.is_archived IS 'Indicates if the customer profile has been archived';
COMMENT ON COLUMN profiles.archived_at IS 'Timestamp when the customer profile was archived';

