-- =====================================================
-- CHECK CURRENT TABLE STRUCTURE
-- =====================================================
-- This script shows you what columns currently exist in your tables
-- Run this first to see what's already there
-- =====================================================

-- Check orders table structure
SELECT 
    'ORDERS TABLE' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check if specific columns exist in orders table
SELECT 
    'ORDERS COLUMNS CHECK' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'guest_customer_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as guest_customer_id,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'user_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as user_id,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'is_guest_order'
    ) THEN 'EXISTS' ELSE 'MISSING' END as is_guest_order;

-- Check what tables exist
SELECT 
    'EXISTING TABLES' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check if user_carts table exists and its structure
SELECT 
    'USER_CARTS TABLE' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_carts' 
ORDER BY ordinal_position;

-- Check if users table exists and its structure
SELECT 
    'USERS TABLE' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if guest_customers table exists and its structure
SELECT 
    'GUEST_CUSTOMERS TABLE' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'guest_customers' 
ORDER BY ordinal_position;
