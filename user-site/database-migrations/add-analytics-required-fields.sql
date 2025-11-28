-- =====================================================
-- Analytics System - Missing Fields & Indexes Migration
-- =====================================================
-- This migration adds missing fields and indexes required
-- by the real-time analytics dashboard system.
-- Run this in your Supabase SQL Editor.
-- =====================================================

-- =====================================================
-- 1. PRODUCTS TABLE - Ensure category_name is populated
-- =====================================================
-- The analytics system uses 'category_name' field from products.
-- If category_name is NULL, populate it from categories table.

-- Update products with NULL category_name to use category name from categories table
UPDATE products p
SET category_name = c.name
FROM categories c
WHERE p.category_id = c.id
  AND p.category_name IS NULL
  AND p.category_id IS NOT NULL;

-- Add a trigger to automatically update category_name when category_id changes
CREATE OR REPLACE FUNCTION update_product_category_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    SELECT name INTO NEW.category_name
    FROM categories
    WHERE id = NEW.category_id;
  ELSE
    NEW.category_name := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_product_category_name ON products;
CREATE TRIGGER trigger_update_product_category_name
  BEFORE INSERT OR UPDATE OF category_id ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_category_name();

-- =====================================================
-- 2. ADD MISSING INDEXES FOR ANALYTICS PERFORMANCE
-- =====================================================

-- Orders table indexes (for time-based queries)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at ON orders(payment_status, created_at);

-- Order items indexes (for product/category analytics)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_id);

-- Products indexes (for category and inventory analytics)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category_name ON products(category_name);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_category_stock ON products(category_name, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- =====================================================
-- 3. ENSURE REQUIRED FIELDS HAVE DEFAULT VALUES
-- =====================================================

-- Ensure order_items has proper defaults
ALTER TABLE order_items 
  ALTER COLUMN quantity SET DEFAULT 1,
  ALTER COLUMN price SET DEFAULT 0;

-- Ensure products.category_name can be NULL (already allowed, but ensure it's clear)
-- No change needed - category_name is already nullable

-- =====================================================
-- 4. ADD COMPUTED COLUMN FOR ANALYTICS (Optional)
-- =====================================================
-- Add a computed field that combines category_id and category_name
-- This helps with analytics queries

-- Note: PostgreSQL doesn't support computed columns directly,
-- but we can use a view or ensure category_name is always synced (via trigger above)

-- =====================================================
-- 5. CREATE MATERIALIZED VIEW FOR DAILY SALES (Optional Performance Boost)
-- =====================================================
-- This can significantly speed up analytics queries for large datasets

-- Drop if exists
DROP MATERIALIZED VIEW IF EXISTS daily_sales_summary;

CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as order_count,
  COUNT(DISTINCT user_id) as unique_customers,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
  SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END) as delivered_revenue
FROM orders
WHERE status IN ('delivered', 'completed', 'paid')
GROUP BY DATE(created_at);

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_sales_summary_date ON daily_sales_summary(sale_date);

-- =====================================================
-- 6. CREATE FUNCTION TO REFRESH MATERIALIZED VIEW
-- =====================================================
-- Call this function periodically (e.g., daily via cron) to refresh the view

CREATE OR REPLACE FUNCTION refresh_daily_sales_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN products.category_name IS 'Category name for analytics. Auto-populated from categories table via trigger.';
COMMENT ON COLUMN orders.created_at IS 'Used for time-based analytics queries. Indexed for performance.';
COMMENT ON COLUMN order_items.product_id IS 'Used for product analytics. Indexed for performance.';
COMMENT ON MATERIALIZED VIEW daily_sales_summary IS 'Pre-aggregated daily sales data for faster analytics queries. Refresh daily.';

-- =====================================================
-- 8. VERIFY REQUIRED FIELDS EXIST
-- =====================================================
-- Run these queries to verify all required fields exist:

-- Check orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'total_amount'
  ) THEN
    RAISE EXCEPTION 'Missing required column: orders.total_amount';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'Missing required column: orders.status';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    RAISE EXCEPTION 'Missing required column: orders.payment_status';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'created_at'
  ) THEN
    RAISE EXCEPTION 'Missing required column: orders.created_at';
  END IF;
END $$;

-- Check order_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'product_id'
  ) THEN
    RAISE EXCEPTION 'Missing required column: order_items.product_id';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'quantity'
  ) THEN
    RAISE EXCEPTION 'Missing required column: order_items.quantity';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'price'
  ) THEN
    RAISE EXCEPTION 'Missing required column: order_items.price';
  END IF;
END $$;

-- Check products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    RAISE EXCEPTION 'Missing required column: products.stock_quantity';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_name'
  ) THEN
    RAISE EXCEPTION 'Missing required column: products.category_name';
  END IF;
END $$;

-- =====================================================
-- 9. GRANT PERMISSIONS FOR REALTIME (if using RLS)
-- =====================================================
-- If you're using Row Level Security, ensure analytics can read data
-- Uncomment and adjust these policies as needed:

-- Allow authenticated users with admin role to read all orders
-- CREATE POLICY IF NOT EXISTS "Admins can read all orders for analytics"
-- ON orders FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM profiles
--     WHERE profiles.id = auth.uid()
--     AND profiles.is_admin = true
--   )
-- );

-- Allow authenticated users with admin role to read all order_items
-- CREATE POLICY IF NOT EXISTS "Admins can read all order_items for analytics"
-- ON order_items FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM profiles
--     WHERE profiles.id = auth.uid()
--     AND profiles.is_admin = true
--   )
-- );

-- Allow authenticated users with admin role to read all products
-- CREATE POLICY IF NOT EXISTS "Admins can read all products for analytics"
-- ON products FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM profiles
--     WHERE profiles.id = auth.uid()
--     AND profiles.is_admin = true
--   )
-- );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- After running this migration:
-- 1. Verify indexes were created: SELECT * FROM pg_indexes WHERE tablename IN ('orders', 'order_items', 'products');
-- 2. Test the trigger: Update a product's category_id and verify category_name updates
-- 3. Refresh materialized view: SELECT refresh_daily_sales_summary();
-- 4. Set up a cron job to refresh the materialized view daily (optional)
-- =====================================================

