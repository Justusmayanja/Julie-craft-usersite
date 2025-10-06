-- =====================================================
-- FIX USER_CARTS TABLE CONSTRAINTS
-- =====================================================
-- This script ensures the user_carts table has proper constraints
-- for the cart save functionality to work correctly
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

-- Check current constraints on user_carts table
SELECT 
    'USER_CARTS CONSTRAINTS' as info,
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_carts'
ORDER BY tc.constraint_type, tc.constraint_name;
