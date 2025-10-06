-- Fix get_user_with_profile function to match actual database schema
-- Run this in your Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_with_profile(UUID);

-- Create the function with correct return types that match the actual profiles table
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
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.phone,
        p.first_name,
        p.last_name,
        CONCAT(p.first_name, ' ', p.last_name) as full_name,
        p.avatar_url,
        p.is_verified,
        p.preferences,
        p.bio,
        p.location,
        p.website,
        p.timezone,
        p.language,
        p.created_at,
        p.updated_at,
        p.last_login
    FROM public.profiles p
    WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was created successfully
SELECT 'get_user_with_profile function has been recreated with correct return types.' as status;
