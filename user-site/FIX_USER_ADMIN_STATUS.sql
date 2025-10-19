-- Fix admin status for specific user and test the function
-- Run this in your Supabase SQL Editor

-- 1. First, update the get_user_with_profile function to include is_admin field
DROP FUNCTION IF EXISTS public.get_user_with_profile(UUID);

CREATE OR REPLACE FUNCTION public.get_user_with_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    phone VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN,
    preferences JSONB,
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    timezone VARCHAR(50),
    language VARCHAR(50),
    is_admin BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email::VARCHAR(255),
        u.phone::VARCHAR(20),
        p.first_name::VARCHAR(100),
        p.last_name::VARCHAR(100),
        COALESCE(p.first_name || ' ' || p.last_name, p.first_name, p.last_name, 'User')::TEXT as full_name,
        p.avatar_url::TEXT,
        p.is_verified,
        p.preferences,
        p.bio::TEXT,
        p.location::VARCHAR(255),
        p.website::VARCHAR(255),
        p.timezone::VARCHAR(50),
        p.language::VARCHAR(50),
        COALESCE(p.is_admin, false) as is_admin,
        u.created_at,
        u.updated_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Check current status of the specific user
SELECT 'Current user profile:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_admin,
    created_at,
    updated_at
FROM profiles 
WHERE id = '68963392-dc37-4d30-95e5-09446edb2263';

-- 3. Make this user an admin (if they should be)
UPDATE profiles 
SET 
    is_admin = true,
    updated_at = NOW()
WHERE id = '68963392-dc37-4d30-95e5-09446edb2263';

-- 4. Verify the update
SELECT 'Updated user profile:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_admin,
    updated_at
FROM profiles 
WHERE id = '68963392-dc37-4d30-95e5-09446edb2263';

-- 5. Test the function with this user
SELECT 'Testing get_user_with_profile function:' as info;
SELECT * FROM get_user_with_profile('68963392-dc37-4d30-95e5-09446edb2263');

-- 6. Check all admin users
SELECT 'All admin users:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_admin,
    created_at
FROM profiles 
WHERE is_admin = true;
