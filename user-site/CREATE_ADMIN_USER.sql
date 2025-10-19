-- Create an admin user if needed
-- Run this in your Supabase SQL Editor

-- 1. First, check if you have any users
SELECT 'Existing auth users:' as info;
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- 2. If you need to create an admin user, first create the auth user
-- (You'll need to do this through the Supabase Auth UI or API)
-- Then update their profile to be admin

-- 3. To make an existing user an admin, run this (replace with actual user UUID):
UPDATE profiles 
SET 
    is_admin = true,
    updated_at = NOW()
WHERE email = 'your-admin-email@example.com';

-- 4. Verify the admin user was created
SELECT 'Admin users after update:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_admin,
    updated_at
FROM profiles 
WHERE is_admin = true;

-- 5. Test the function with the admin user
-- SELECT * FROM get_user_with_profile('admin-user-uuid-here');
