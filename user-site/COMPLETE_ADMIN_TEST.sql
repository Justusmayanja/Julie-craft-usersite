-- Complete test script for admin functionality
-- Run this in your Supabase SQL Editor

-- 1. First, ensure the function is updated
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

-- 2. Check if we have any admin users
SELECT 'Current admin users:' as info;
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.is_admin,
    p.created_at
FROM profiles p 
WHERE p.role = 'admin' OR p.is_admin = true;

-- 3. If no admin users, create one (you'll need to create auth user first)
-- This assumes you have an existing auth user with email 'admin@test.com'
-- If not, create one through the Supabase Auth UI first

-- Check if auth user exists
SELECT 'Auth users with admin email:' as info;
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@test.com';

-- Update/create profile for admin user
-- Replace 'your-admin-user-uuid-here' with the actual UUID from auth.users above
INSERT INTO profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_admin, 
    is_verified, 
    created_at, 
    updated_at
) VALUES (
    'your-admin-user-uuid-here', -- Replace with actual UUID
    'admin@test.com',
    'Admin',
    'User',
    'admin',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_admin = true,
    updated_at = NOW();

-- 4. Test the function with admin user
SELECT 'Testing get_user_with_profile function:' as info;
SELECT * FROM get_user_with_profile('your-admin-user-uuid-here'); -- Replace with actual UUID

-- 5. Verify admin user setup
SELECT 'Final admin user verification:' as info;
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.is_admin,
    'Should be admin: ' || CASE 
        WHEN p.role = 'admin' OR p.is_admin = true THEN 'YES' 
        ELSE 'NO' 
    END as admin_check
FROM profiles p 
WHERE p.email = 'admin@test.com';

-- 6. Check all users with admin privileges
SELECT 'All users with admin privileges:' as info;
SELECT 
    p.id,
    p.email,
    p.role,
    p.is_admin,
    CASE 
        WHEN p.role = 'admin' OR p.role = 'super_admin' OR p.is_admin = true THEN 'ADMIN'
        ELSE 'CUSTOMER'
    END as user_type
FROM profiles p 
ORDER BY p.created_at DESC;
