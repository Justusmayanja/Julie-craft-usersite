-- =====================================================
-- FIX ORDER_ITEMS TABLE - ADD MISSING COLUMNS
-- =====================================================
-- This script adds the missing product_image column to the order_items table
-- and any other missing columns that might be needed
-- =====================================================

-- Add product_image column to order_items table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_image') THEN
        ALTER TABLE order_items ADD COLUMN product_image VARCHAR(500);
    END IF;
END $$;

-- Add any other missing columns that might be needed
DO $$ 
BEGIN
    -- Add product_sku column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_sku') THEN
        ALTER TABLE order_items ADD COLUMN product_sku VARCHAR(100);
    END IF;
    
    -- Add total_price column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'total_price') THEN
        ALTER TABLE order_items ADD COLUMN total_price DECIMAL(10,2);
    END IF;
END $$;

-- Update existing records to have default values for new columns
UPDATE order_items 
SET 
    product_image = COALESCE(product_image, ''),
    product_sku = COALESCE(product_sku, ''),
    total_price = COALESCE(total_price, quantity * unit_price)
WHERE 
    product_image IS NULL 
    OR product_sku IS NULL 
    OR total_price IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_image ON order_items(product_image);
CREATE INDEX IF NOT EXISTS idx_order_items_product_sku ON order_items(product_sku);

SELECT 'Order items table fixed successfully!' as status;
