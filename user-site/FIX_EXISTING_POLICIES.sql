-- =====================================================
-- FIX EXISTING POLICIES SCRIPT
-- =====================================================
-- This script fixes the existing RLS policies that are causing conflicts
-- 
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- DROP AND RECREATE EXISTING POLICIES
-- =====================================================

-- Fix profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix user_carts table policies
DROP POLICY IF EXISTS "Users can view own carts" ON public.user_carts;
DROP POLICY IF EXISTS "Users can insert own carts" ON public.user_carts;
DROP POLICY IF EXISTS "Users can update own carts" ON public.user_carts;
DROP POLICY IF EXISTS "Users can delete own carts" ON public.user_carts;

CREATE POLICY "Users can view own carts" ON public.user_carts
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own carts" ON public.user_carts
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own carts" ON public.user_carts
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own carts" ON public.user_carts
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Existing policies fixed successfully!';
    RAISE NOTICE 'All RLS policies have been dropped and recreated properly.';
END $$;
