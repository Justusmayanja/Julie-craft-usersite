-- =====================================================
-- FIX MISSING COLUMNS IN ORDERS TABLE
-- =====================================================
-- This script adds missing columns to the orders table
-- that are needed for order creation
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

-- Check current orders table structure
SELECT 
    'ORDERS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
