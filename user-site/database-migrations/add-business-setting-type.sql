-- =====================================================
-- MIGRATION: Add 'business' to site_settings.setting_type
-- =====================================================
-- This migration adds 'business' as a valid setting_type value
-- for the site_settings table to support business settings management
-- 
-- This script is safe to run multiple times (idempotent)

-- Step 1: Drop the existing CHECK constraint (if it exists)
ALTER TABLE site_settings 
DROP CONSTRAINT IF EXISTS site_settings_setting_type_check;

-- Step 2: Add the new CHECK constraint with 'business' included
ALTER TABLE site_settings
ADD CONSTRAINT site_settings_setting_type_check 
CHECK (setting_type IN (
    'general',
    'footer',
    'header',
    'navigation',
    'social',
    'contact',
    'seo',
    'appearance',
    'business',  -- New: Added for business settings
    'custom'
));

-- Verification: Run this query to verify the constraint was added correctly
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'site_settings'::regclass 
-- AND conname = 'site_settings_setting_type_check';

