-- Simple fix for admin user detection
-- This ensures the get_user_with_profile function returns the is_admin field
-- Run this in your Supabase SQL Editor

-- Drop and recreate the function with is_admin field
DROP FUNCTION IF EXISTS public.get_user_with_profile(UUID);

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
    is_admin BOOLEAN,
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
        COALESCE(p.is_admin, false) as is_admin,
        u.created_at,
        u.updated_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function with a user (replace with actual user UUID)
-- SELECT * FROM get_user_with_profile('your-user-uuid-here');

-- Check if we have admin users
SELECT 'Admin users in profiles table:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_admin,
    created_at
FROM profiles 
WHERE is_admin = true;

SELECT 'Function updated successfully - is_admin field is now included' as status;
