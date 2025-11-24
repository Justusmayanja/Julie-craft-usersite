# Business Settings Database Migration

## Overview
This migration adds support for 'business' as a valid `setting_type` in the `site_settings` table to enable the Business Settings management feature.

## What Changed

### 1. Database Schema Update
- **File**: `database/site_content_schema.sql`
- **Change**: Added 'business' to the allowed `setting_type` values in the CHECK constraint

### 2. Migration Script
- **File**: `database-migrations/add-business-setting-type.sql`
- **Purpose**: Updates existing databases to include 'business' as a valid setting type

## How to Apply

### For New Databases
If you're setting up a fresh database, the updated schema in `database/site_content_schema.sql` already includes 'business' in the constraint.

### For Existing Databases
Run the migration script:

```sql
-- Run this in your Supabase SQL editor or database client
\i database-migrations/add-business-setting-type.sql
```

Or copy and paste the contents of `add-business-setting-type.sql` into your SQL editor.

## Business Settings Fields

The following settings are stored with `setting_type = 'business'`:

- `business_name` - Business name
- `business_email` - Business email address
- `business_phone` - Business phone number
- `business_address` - Street address
- `business_city` - City
- `business_state` - State/Province
- `business_zip_code` - ZIP/Postal code
- `business_country` - Country
- `business_website` - Website URL
- `business_description` - Business description
- `timezone` - Business timezone
- `currency` - Default currency

## Notes

- The `setting_value` column is JSONB, which can store strings, numbers, objects, or arrays
- Supabase automatically handles conversion of JavaScript strings to JSONB
- All business settings use `setting_type = 'business'` for easy filtering and management

