-- =====================================================
-- CUSTOMER MANAGEMENT FIX SCRIPT
-- =====================================================
-- This script fixes the customer management issues by ensuring
-- proper table structure and relationships.
-- 
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ENSURE USERS TABLE EXISTS AND IS PROPERLY CONFIGURED
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    is_guest BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 2. ENSURE PROFILES TABLE EXISTS AND IS PROPERLY CONFIGURED
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID NOT NULL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
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
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- =====================================================
-- 3. ENSURE USER_CARTS TABLE EXISTS AND IS PROPERLY CONFIGURED
-- =====================================================
CREATE TABLE IF NOT EXISTS user_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE,
    cart_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_carts table
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_session_id ON user_carts(session_id);

-- =====================================================
-- 4. UPDATE EXISTING TABLES TO REFERENCE USERS TABLE
-- =====================================================

-- Update orders table to reference users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'user_id') THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
END $$;

-- Update addresses table to reference users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'addresses' AND column_name = 'user_id') THEN
        ALTER TABLE addresses ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
END $$;

-- Update wishlists table to reference users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wishlists' AND column_name = 'user_id') THEN
        ALTER TABLE wishlists ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;
END $$;

-- Update media table to reference users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'media' AND column_name = 'uploaded_by') THEN
        ALTER TABLE media ADD COLUMN uploaded_by UUID REFERENCES users(id);
    END IF;
END $$;

-- =====================================================
-- 5. CREATE FUNCTION TO AUTOMATICALLY CREATE PROFILE ON USER CREATION
-- =====================================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    first_name_part TEXT;
    last_name_part TEXT;
BEGIN
    -- Split name into first and last name
    first_name_part := split_part(NEW.name, ' ', 1);
    last_name_part := substring(NEW.name from position(' ' in NEW.name) + 1);
    
    -- Create profile record
    INSERT INTO profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        is_admin,
        is_verified,
        created_at,
        updated_at,
        preferences
    ) VALUES (
        NEW.id,
        NEW.email,
        first_name_part,
        last_name_part,
        NEW.phone,
        false,
        false,
        NEW.created_at,
        NEW.updated_at,
        '{"sms": false, "push": true, "email": true, "marketing": true}'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE TRIGGER TO AUTOMATICALLY CREATE PROFILE
-- =====================================================
DROP TRIGGER IF EXISTS trigger_create_user_profile ON users;
CREATE TRIGGER trigger_create_user_profile
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- 7. CREATE FUNCTION TO SYNC USER DATA WITH PROFILE
-- =====================================================
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile when user data changes
    UPDATE profiles 
    SET 
        email = NEW.email,
        first_name = split_part(NEW.name, ' ', 1),
        last_name = substring(NEW.name from position(' ' in NEW.name) + 1),
        phone = NEW.phone,
        updated_at = NEW.updated_at
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. CREATE TRIGGER TO SYNC USER DATA
-- =====================================================
DROP TRIGGER IF EXISTS trigger_sync_user_profile ON users;
CREATE TRIGGER trigger_sync_user_profile
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_profile();

-- =====================================================
-- 9. CREATE FUNCTION TO CLEAN UP ORPHANED CARTS
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_orphaned_carts()
RETURNS void AS $$
BEGIN
    -- Delete carts that are older than 30 days and have no associated user
    DELETE FROM user_carts 
    WHERE user_id IS NULL 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. SET UP ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_carts table
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

-- Create policy for users table (users can only see their own data)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create policy for profiles table (users can only see their own profile)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create policy for user_carts table (users can only see their own carts)
CREATE POLICY "Users can view own carts" ON user_carts
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own carts" ON user_carts
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own carts" ON user_carts
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own carts" ON user_carts
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- 11. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_carts TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Customer management fix script completed successfully!';
    RAISE NOTICE 'The following improvements have been made:';
    RAISE NOTICE '1. Users and profiles tables are properly configured';
    RAISE NOTICE '2. User carts table is properly configured';
    RAISE NOTICE '3. Automatic profile creation on user registration';
    RAISE NOTICE '4. Data synchronization between users and profiles tables';
    RAISE NOTICE '5. Row Level Security policies for data protection';
    RAISE NOTICE '6. Proper foreign key relationships established';
END $$;
