-- Fix get_user_with_profile function to include role and is_admin fields
-- Run this in your Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_with_profile(UUID);

-- Create the function with role and is_admin fields included
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
    is_admin BOOLEAN,
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
        COALESCE(p.role, 'customer') as role,
        COALESCE(p.is_admin, false) as is_admin,
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

-- Verify the function was created successfully
SELECT 'get_user_with_profile function has been updated to include role and is_admin fields.' as status;
