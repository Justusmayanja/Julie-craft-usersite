-- =====================================================
-- MIGRATION: Migrate business settings from site_settings to business_settings table
-- =====================================================
-- This migration moves business settings from the key-value site_settings table
-- to the structured business_settings table for better type safety and organization
-- 
-- This script is safe to run multiple times (idempotent)

-- Step 1: Ensure business_settings table exists (it should already exist)
-- If not, create it
CREATE TABLE IF NOT EXISTS public.business_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  email text NULL,
  phone text NULL,
  website text NULL,
  description text NULL,
  logo_url text NULL,
  address_line1 text NULL,
  address_line2 text NULL,
  city text NULL,
  state text NULL,
  zip_code text NULL,
  country text NULL DEFAULT 'Uganda'::text,
  tax_id text NULL,
  currency text NULL DEFAULT 'UGX'::text,
  timezone text NULL DEFAULT 'Africa/Kampala'::text,
  language text NULL DEFAULT 'English'::text,
  settings jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT business_settings_pkey PRIMARY KEY (id)
);

-- Step 2: Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_business_settings_updated_at ON business_settings;
CREATE TRIGGER update_business_settings_updated_at
    BEFORE UPDATE ON business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Migrate data from site_settings to business_settings
-- Only migrate if business_settings is empty
DO $$
DECLARE
  business_count INTEGER;
  business_name_val TEXT;
  business_email_val TEXT;
  business_phone_val TEXT;
  business_address_val TEXT;
  business_city_val TEXT;
  business_state_val TEXT;
  business_zip_code_val TEXT;
  business_country_val TEXT;
  business_website_val TEXT;
  business_description_val TEXT;
  logo_url_val TEXT;
  timezone_val TEXT;
  currency_val TEXT;
BEGIN
  -- Check if business_settings table is empty
  SELECT COUNT(*) INTO business_count FROM business_settings;
  
  -- Only migrate if table is empty
  IF business_count = 0 THEN
    -- Extract values from site_settings where setting_type = 'business'
    SELECT 
      MAX(CASE WHEN setting_key = 'business_name' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'business_email' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'business_phone' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'business_address' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'business_city' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'business_state' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'business_zip_code' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'business_country' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'business_website' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'business_description' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'logo_url' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'timezone' THEN setting_value::text END),
      MAX(CASE WHEN setting_key = 'currency' THEN setting_value::text END)
    INTO 
      business_name_val,
      business_email_val,
      business_phone_val,
      business_address_val,
      business_city_val,
      business_state_val,
      business_zip_code_val,
      business_country_val,
      business_website_val,
      business_description_val,
      logo_url_val,
      timezone_val,
      currency_val
    FROM site_settings
    WHERE setting_type = 'business';
    
    -- Insert into business_settings if we have at least a business name
    IF business_name_val IS NOT NULL OR business_email_val IS NOT NULL THEN
      INSERT INTO business_settings (
        business_name,
        email,
        phone,
        website,
        description,
        logo_url,
        address_line1,
        city,
        state,
        zip_code,
        country,
        currency,
        timezone
      ) VALUES (
        COALESCE(business_name_val, 'Julie Crafts'),
        business_email_val,
        business_phone_val,
        business_website_val,
        business_description_val,
        logo_url_val,
        business_address_val,
        business_city_val,
        business_state_val,
        business_zip_code_val,
        COALESCE(business_country_val, 'Uganda'),
        COALESCE(currency_val, 'UGX'),
        COALESCE(timezone_val, 'Africa/Kampala')
      );
      
      RAISE NOTICE 'Business settings migrated successfully from site_settings to business_settings';
    ELSE
      -- Insert default record if no data exists
      INSERT INTO business_settings (
        business_name,
        country,
        currency,
        timezone
      ) VALUES (
        'Julie Crafts',
        'Uganda',
        'UGX',
        'Africa/Kampala'
      );
      
      RAISE NOTICE 'No business settings found in site_settings. Created default record in business_settings';
    END IF;
  ELSE
    RAISE NOTICE 'Business settings table already has data. Skipping migration.';
  END IF;
END $$;

-- Step 4: Optional - Remove business settings from site_settings after migration
-- Uncomment the following if you want to clean up site_settings after migration
-- DELETE FROM site_settings WHERE setting_type = 'business';

-- Verification queries:
-- Check business_settings
-- SELECT * FROM business_settings;
-- 
-- Check remaining business settings in site_settings
-- SELECT * FROM site_settings WHERE setting_type = 'business';

