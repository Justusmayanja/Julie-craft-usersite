-- =====================================================
-- SIMPLIFIED SUPABASE AUTH - CLEAN SCHEMA
-- =====================================================
-- This script creates a clean, simplified schema using only:
-- - auth.users (Supabase built-in authentication)
-- - profiles (user data and profiles)  
-- - user_carts (cart management)
-- 
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ENSURE PROFILES TABLE EXISTS AND REFERENCES AUTH.USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID NOT NULL PRIMARY KEY,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    avatar_url TEXT,
    date_of_birth DATE,
    gender CHARACTER VARYING,
    is_verified BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{"sms": false, "push": true, "email": true, "marketing": true}',
    last_login TIMESTAMP WITH TIME ZONE,
    bio TEXT,
    location TEXT,
    website TEXT,
    timezone TEXT DEFAULT 'America/Los_Angeles',
    language TEXT DEFAULT 'English',
    notifications JSONB DEFAULT '{"sms": false, "push": true, "email": true, "marketing": true}',
    -- Additional columns from customers table
    role VARCHAR(50) DEFAULT 'customer',
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'blocked'::text])),
    notes TEXT,
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- =====================================================
-- 2. ENSURE USER_CARTS TABLE EXISTS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE,
    cart_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_carts table
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_session_id ON user_carts(session_id);

-- =====================================================
-- 3. UPDATE EXISTING TABLES TO REFERENCE AUTH.USERS
-- =====================================================

-- Update orders table to reference auth.users
DO $$ 
BEGIN
    -- Remove old foreign key constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'orders' AND constraint_name = 'orders_user_id_fkey') THEN
        ALTER TABLE orders DROP CONSTRAINT orders_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'orders' AND constraint_name = 'orders_customer_id_fkey') THEN
        ALTER TABLE orders DROP CONSTRAINT orders_customer_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'orders' AND constraint_name = 'orders_guest_customer_id_fkey') THEN
        ALTER TABLE orders DROP CONSTRAINT orders_guest_customer_id_fkey;
    END IF;
    
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'user_id') THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add new constraint
    ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
END $$;

-- Update addresses table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'addresses' AND column_name = 'user_id') THEN
        ALTER TABLE addresses ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update wishlists table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wishlists' AND column_name = 'user_id') THEN
        ALTER TABLE wishlists ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update media table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'media' AND column_name = 'uploaded_by') THEN
        ALTER TABLE media ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- =====================================================
-- 4. CREATE FUNCTION TO AUTOMATICALLY CREATE PROFILE ON USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_name_part TEXT;
    last_name_part TEXT;
BEGIN
    -- Split name into first and last name
    first_name_part := split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1);
    last_name_part := substring(NEW.raw_user_meta_data->>'full_name' from position(' ' in NEW.raw_user_meta_data->>'full_name') + 1);
    
    -- If no full_name in metadata, try to split email
    IF first_name_part IS NULL OR first_name_part = '' THEN
        first_name_part := split_part(NEW.email, '@', 1);
        last_name_part := '';
    END IF;
    
    -- Create profile record
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        is_admin,
        is_verified,
        created_at,
        updated_at,
        preferences,
        role,
        total_orders,
        total_spent,
        join_date,
        status
    ) VALUES (
        NEW.id,
        NEW.email,
        first_name_part,
        last_name_part,
        NEW.raw_user_meta_data->>'phone',
        false,
        NEW.email_confirmed_at IS NOT NULL,
        NEW.created_at,
        NEW.updated_at,
        '{"sms": false, "push": true, "email": true, "marketing": true}',
        'customer',
        0,
        0,
        NEW.created_at,
        'active'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TRIGGER TO AUTOMATICALLY CREATE PROFILE
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. CREATE FUNCTION TO SYNC USER DATA WITH PROFILE
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile when user data changes
    UPDATE public.profiles 
    SET 
        email = NEW.email,
        first_name = split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1),
        last_name = substring(NEW.raw_user_meta_data->>'full_name' from position(' ' in NEW.raw_user_meta_data->>'full_name') + 1),
        phone = NEW.raw_user_meta_data->>'phone',
        is_verified = NEW.email_confirmed_at IS NOT NULL,
        updated_at = NEW.updated_at
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE TRIGGER TO SYNC USER DATA
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_update();

-- =====================================================
-- 8. CREATE HELPER FUNCTION FOR API USE
-- =====================================================

-- Drop existing function if it exists
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
        p.role,
        p.is_admin,
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

-- =====================================================
-- 9. SET UP ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_carts table
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own carts" ON public.user_carts;
DROP POLICY IF EXISTS "Users can insert own carts" ON public.user_carts;
DROP POLICY IF EXISTS "Users can update own carts" ON public.user_carts;
DROP POLICY IF EXISTS "Users can delete own carts" ON public.user_carts;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for user_carts table
CREATE POLICY "Users can view own carts" ON public.user_carts
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own carts" ON public.user_carts
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own carts" ON public.user_carts
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own carts" ON public.user_carts
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- 10. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_carts TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Simplified Supabase authentication setup completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Database now uses only 3 core tables:';
    RAISE NOTICE '1. auth.users (Supabase built-in authentication)';
    RAISE NOTICE '2. profiles (user data, preferences, and customer info)';
    RAISE NOTICE '3. user_carts (cart management)';
    RAISE NOTICE '';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '- Automatic profile creation on user signup';
    RAISE NOTICE '- Data synchronization between auth.users and profiles';
    RAISE NOTICE '- Row Level Security policies for data protection';
    RAISE NOTICE '- Helper function for easy user data retrieval';
    RAISE NOTICE '- All existing tables updated to reference auth.users';
    RAISE NOTICE '';
    RAISE NOTICE 'Redundant tables removed: users, customers, guest_customers';
END $$;
