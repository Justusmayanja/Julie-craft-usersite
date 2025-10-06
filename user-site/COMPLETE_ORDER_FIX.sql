-- =====================================================
-- COMPLETE ORDER PLACEMENT FIX
-- =====================================================
-- This script fixes all the issues preventing order placement:
-- 1. Missing columns in orders table
-- 2. Missing constraints in user_carts table
-- 3. Ensures proper table structure for order flow
-- =====================================================

-- =====================================================
-- 1. FIX ORDERS TABLE - ADD MISSING COLUMNS
-- =====================================================

-- Add customer_phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50);
        RAISE NOTICE 'Added customer_phone column to orders table';
    ELSE
        RAISE NOTICE 'customer_phone column already exists in orders table';
    END IF;
END $$;

-- Add payment_method column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
        RAISE NOTICE 'Added payment_method column to orders table';
    ELSE
        RAISE NOTICE 'payment_method column already exists in orders table';
    END IF;
END $$;

-- =====================================================
-- 2. FIX USER_CARTS TABLE - ADD MISSING CONSTRAINTS
-- =====================================================

-- Add unique constraint on user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_carts' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%user_id%'
    ) THEN
        ALTER TABLE user_carts ADD CONSTRAINT user_carts_user_id_unique UNIQUE (user_id);
        RAISE NOTICE 'Added unique constraint on user_id for user_carts table';
    ELSE
        RAISE NOTICE 'Unique constraint on user_id already exists in user_carts table';
    END IF;
END $$;

-- =====================================================
-- 3. ENSURE ORDER_ITEMS TABLE EXISTS WITH PROPER STRUCTURE
-- =====================================================

CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- 4. ENSURE PRODUCTS TABLE HAS PROPER STRUCTURE
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    sku VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    featured BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    category_id UUID,
    featured_image VARCHAR(500),
    images JSONB,
    tags JSONB,
    dimensions JSONB,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Check orders table structure
SELECT 
    'ORDERS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check user_carts constraints
SELECT 
    'USER_CARTS CONSTRAINTS' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_carts'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Check if all required tables exist
SELECT 
    'REQUIRED TABLES CHECK' as info,
    table_name,
    CASE WHEN table_name IN ('orders', 'order_items', 'user_carts', 'products') 
         THEN 'EXISTS' 
         ELSE 'MISSING' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('orders', 'order_items', 'user_carts', 'products')
ORDER BY table_name;
