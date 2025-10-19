-- Check existing admin users and their is_admin status
-- Run this in your Supabase SQL Editor

-- 1. Check all users in profiles table with their admin status
SELECT 'All users in profiles table:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_admin,
    created_at,
    updated_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Check specifically for admin users
SELECT 'Users with is_admin = true:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_admin,
    created_at
FROM profiles 
WHERE is_admin = true;

-- 3. Check if there are any users without profiles
SELECT 'Auth users without profiles:' as info;
SELECT 
    u.id,
    u.email,
    u.created_at as auth_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. Test the get_user_with_profile function (replace with actual user UUID)
-- First, let's see what users we have
SELECT 'Available users for testing:' as info;
SELECT 
    u.id,
    u.email,
    p.is_admin
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LIMIT 5;

-- 5. If you have a user, test the function like this (replace the UUID):
-- SELECT * FROM get_user_with_profile('your-user-uuid-here');
