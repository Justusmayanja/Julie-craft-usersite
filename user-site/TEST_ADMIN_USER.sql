-- Test script to create an admin user and verify role functionality
-- Run this in your Supabase SQL Editor

-- First, let's check if we have any existing admin users
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

-- Create a test admin user (you'll need to create the auth user first)
-- This assumes you have an existing auth user with email 'admin@test.com'
-- If not, create one through the Supabase Auth UI first

-- Update an existing user to be an admin
-- Replace 'your-admin-user-id-here' with the actual UUID from auth.users
UPDATE profiles 
SET 
    role = 'admin',
    is_admin = true,
    updated_at = NOW()
WHERE email = 'admin@test.com'; -- Replace with your admin email

-- Verify the admin user was created/updated
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.is_admin,
    p.created_at,
    p.updated_at
FROM profiles p 
WHERE p.email = 'admin@test.com'; -- Replace with your admin email

-- Test the get_user_with_profile function with the admin user
-- Replace 'your-admin-user-id-here' with the actual UUID
SELECT * FROM get_user_with_profile('your-admin-user-id-here');

-- Check all admin users
SELECT 
    'All admin users:' as info,
    p.id,
    p.email,
    p.role,
    p.is_admin
FROM profiles p 
WHERE p.role IN ('admin', 'super_admin') OR p.is_admin = true;
