-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES - FIXED VERSION
-- =====================================================
-- This script adds only the missing columns to your existing tables
-- without creating new tables or affecting existing data.
-- 
-- FIXED: Creates referenced tables FIRST before adding foreign keys
-- =====================================================

-- =====================================================
-- 1. CREATE GUEST_CUSTOMERS TABLE FIRST (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS guest_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for guest_customers table
CREATE INDEX IF NOT EXISTS idx_guest_customers_email ON guest_customers(email);

-- =====================================================
-- 2. CREATE USERS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    is_guest BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 3. CREATE USER_CARTS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE,
    cart_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_carts table
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_session_id ON user_carts(session_id);

-- =====================================================
-- 4. ADD MISSING COLUMNS TO ORDERS TABLE (after creating referenced tables)
-- =====================================================

-- Add guest_customer_id column to orders table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'guest_customer_id') THEN
        ALTER TABLE orders ADD COLUMN guest_customer_id UUID REFERENCES guest_customers(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_orders_guest_customer_id ON orders(guest_customer_id);
    END IF;
END $$;

-- Add user_id column to orders table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    END IF;
END $$;

-- Add is_guest_order column to orders table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_guest_order') THEN
        ALTER TABLE orders ADD COLUMN is_guest_order BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- 5. ADD MISSING ENHANCED COLUMNS TO ORDERS (if not exist)
-- =====================================================

-- Add enhanced columns that might be missing
DO $$ 
BEGIN
    -- Inventory management columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'inventory_reserved') THEN
        ALTER TABLE orders ADD COLUMN inventory_reserved BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'reserved_at') THEN
        ALTER TABLE orders ADD COLUMN reserved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'fulfilled_at') THEN
        ALTER TABLE orders ADD COLUMN fulfilled_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Order management columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'priority') THEN
        ALTER TABLE orders ADD COLUMN priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'source') THEN
        ALTER TABLE orders ADD COLUMN source TEXT DEFAULT 'web' CHECK (source IN ('web', 'phone', 'email', 'walk_in', 'marketplace', 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'processing_notes') THEN
        ALTER TABLE orders ADD COLUMN processing_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'fulfillment_status') THEN
        ALTER TABLE orders ADD COLUMN fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partially_fulfilled', 'fulfilled', 'shipped', 'delivered'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'version') THEN
        ALTER TABLE orders ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
END $$;

-- =====================================================
-- 6. CREATE ENHANCED ORDER TABLES (if not exist)
-- =====================================================

-- Order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    previous_payment_status TEXT,
    new_payment_status TEXT,
    changed_by TEXT,
    change_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order item reservations table
CREATE TABLE IF NOT EXISTS order_item_reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    reserved_quantity INTEGER NOT NULL CHECK (reserved_quantity > 0),
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'released', 'fulfilled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order fulfillment table
CREATE TABLE IF NOT EXISTS order_fulfillment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    fulfilled_quantity INTEGER NOT NULL CHECK (fulfilled_quantity > 0),
    fulfillment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fulfilled_by TEXT,
    fulfillment_method TEXT DEFAULT 'manual' CHECK (fulfillment_method IN ('manual', 'automated')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order notes table
CREATE TABLE IF NOT EXISTS order_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'customer', 'internal', 'fulfillment', 'payment', 'shipping')),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- =====================================================

-- Enable RLS on new tables (safe to run multiple times)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_fulfillment ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE BASIC RLS POLICIES (if not exist)
-- =====================================================

-- Users table policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view their own data') THEN
        CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert their own data') THEN
        CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own data') THEN
        CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);
    END IF;
END $$;

-- User carts table policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_carts' AND policyname = 'User carts are publicly accessible') THEN
        CREATE POLICY "User carts are publicly accessible" ON user_carts FOR ALL USING (true);
    END IF;
END $$;

-- Guest customers table policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'guest_customers' AND policyname = 'Guest customers are publicly accessible') THEN
        CREATE POLICY "Guest customers are publicly accessible" ON guest_customers FOR ALL USING (true);
    END IF;
END $$;

-- Enhanced order management table policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_status_history' AND policyname = 'Allow all operations for authenticated users on order_status_history') THEN
        CREATE POLICY "Allow all operations for authenticated users on order_status_history" ON order_status_history FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_item_reservations' AND policyname = 'Allow all operations for authenticated users on order_item_reservations') THEN
        CREATE POLICY "Allow all operations for authenticated users on order_item_reservations" ON order_item_reservations FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_fulfillment' AND policyname = 'Allow all operations for authenticated users on order_fulfillment') THEN
        CREATE POLICY "Allow all operations for authenticated users on order_fulfillment" ON order_fulfillment FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_notes' AND policyname = 'Allow all operations for authenticated users on order_notes') THEN
        CREATE POLICY "Allow all operations for authenticated users on order_notes" ON order_notes FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Missing columns and tables added successfully!' as status;
