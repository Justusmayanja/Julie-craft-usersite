-- =====================================================
-- QUICK FIX SCRIPT - CREATE MISSING TABLES
-- =====================================================
-- This script creates only the missing tables that are causing
-- the current cart save/load errors.
-- 
-- Run this first to fix the immediate issues, then run the
-- full DATABASE_SETUP_SCRIPT.sql for complete setup.
-- =====================================================

-- =====================================================
-- 1. USERS TABLE (for authentication)
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
-- 2. USER_CARTS TABLE (MISSING - causing the error)
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
-- 3. GUEST_CUSTOMERS TABLE (for guest orders)
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
-- 4. BASIC ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_customers ENABLE ROW LEVEL SECURITY;

-- Basic policies for the new tables
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "User carts are publicly accessible" ON user_carts;
CREATE POLICY "User carts are publicly accessible" ON user_carts FOR ALL USING (true);

DROP POLICY IF EXISTS "Guest customers are publicly accessible" ON guest_customers;
CREATE POLICY "Guest customers are publicly accessible" ON guest_customers FOR ALL USING (true);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Quick fix completed! Cart save/load errors should now be resolved.' as status;
