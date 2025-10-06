-- =====================================================
-- FIX FUNCTION CONFLICT SCRIPT
-- =====================================================
-- This script fixes the function return type conflict
-- 
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- DROP EXISTING FUNCTION TO FIX RETURN TYPE CONFLICT
-- =====================================================

-- Drop the existing function that has a different return type
DROP FUNCTION IF EXISTS public.get_user_with_profile(UUID);

-- =====================================================
-- RECREATE FUNCTION WITH CORRECT RETURN TYPE
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_with_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    email TEXT,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN,
    preferences JSONB,
    bio TEXT,
    location TEXT,
    website TEXT,
    timezone TEXT,
    language TEXT,
    role VARCHAR(50),
    total_orders INTEGER,
    total_spent NUMERIC,
    last_order_date TIMESTAMP WITH TIME ZONE,
    join_date TIMESTAMP WITH TIME ZONE,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.phone,
        p.first_name,
        p.last_name,
        COALESCE(p.first_name || ' ' || p.last_name, p.first_name, p.last_name, 'User') as full_name,
        p.avatar_url,
        p.is_verified,
        p.preferences,
        p.bio,
        p.location,
        p.website,
        p.timezone,
        p.language,
        p.role,
        p.total_orders,
        p.total_spent,
        p.last_order_date,
        p.join_date,
        p.status,
        u.created_at,
        u.updated_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Function conflict fixed successfully!';
    RAISE NOTICE 'get_user_with_profile function has been dropped and recreated with correct return type.';
END $$;
