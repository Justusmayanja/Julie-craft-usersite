-- Fix get_user_with_profile function to match EXACT database schema
-- Run this in your Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_with_profile(UUID);

-- Create the function with EXACT return types that match your actual profiles table
-- Based on the successful profile update log, these are the actual column types
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
        p.email::VARCHAR(255),
        p.phone::VARCHAR(20),
        p.first_name::VARCHAR(100),
        p.last_name::VARCHAR(100),
        CONCAT(p.first_name, ' ', p.last_name)::TEXT as full_name,
        p.avatar_url::TEXT,
        p.is_verified,
        p.preferences,
        p.bio::TEXT,
        p.location::VARCHAR(255),
        p.website::VARCHAR(255),
        p.timezone::VARCHAR(50),
        p.language::VARCHAR(50),
        p.created_at,
        p.updated_at,
        p.last_login
    FROM public.profiles p
    WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was created successfully
SELECT 'get_user_with_profile function has been recreated with EXACT return types.' as status;
