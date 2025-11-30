# Business Settings Consolidation

## Overview
This migration consolidates business settings from the `site_settings` table (key-value format) to the structured `business_settings` table for better organization and type safety.

## Problem
- Two tables with overlapping fields: `business_settings` and `site_settings`
- Business settings are currently stored in `site_settings` with `setting_type = 'business'`
- The `business_settings` table exists but is unused
- This creates confusion and potential data inconsistency

## Solution
1. **Migrate data** from `site_settings` (where `setting_type = 'business'`) to `business_settings` table
2. **Update API routes** to use `business_settings` table instead of `site_settings`
3. **Keep `site_settings`** for other setting types (general, contact, social, appearance, etc.)

## Migration Steps

### Step 1: Run the Migration Script
```sql
-- Run this in your Supabase SQL editor
\i database-migrations/migrate-business-settings-to-table.sql
```

Or copy and paste the contents of `migrate-business-settings-to-table.sql` into your SQL editor.

### Step 2: Verify Migration
```sql
-- Check business_settings table
SELECT * FROM business_settings;

-- Check if any business settings remain in site_settings
SELECT * FROM site_settings WHERE setting_type = 'business';
```

### Step 3: Clean Up (Optional)
After verifying the migration worked correctly, you can optionally remove business settings from `site_settings`:

```sql
-- WARNING: Only run this after verifying the migration worked!
DELETE FROM site_settings WHERE setting_type = 'business';
```

## Field Mapping

| site_settings (old) | business_settings (new) |
|---------------------|------------------------|
| `business_name` | `business_name` |
| `business_email` | `email` |
| `business_phone` | `phone` |
| `business_address` | `address_line1` |
| `business_city` | `city` |
| `business_state` | `state` |
| `business_zip_code` | `zip_code` |
| `business_country` | `country` |
| `business_website` | `website` |
| `business_description` | `description` |
| `logo_url` | `logo_url` |
| `timezone` | `timezone` |
| `currency` | `currency` |

## Code Changes

### Updated Files:
1. **`app/api/admin/settings/business/route.ts`**
   - GET: Now fetches from `business_settings` table
   - POST: Now updates `business_settings` table

### API Endpoints:
- `/api/admin/settings/business` - Uses `business_settings` table
- `/api/site-content/settings` - Still uses `site_settings` for non-business settings

## Benefits

1. **Better Structure**: Typed columns instead of key-value pairs
2. **Type Safety**: Database enforces data types
3. **Simpler Queries**: Direct column access instead of JSONB extraction
4. **Clear Separation**: Business settings separate from general site settings
5. **Better Performance**: Direct column access is faster than JSONB queries

## Rollback

If you need to rollback, you can:
1. Re-insert business settings into `site_settings` from `business_settings`
2. Revert the API route changes

## Notes

- The migration script is idempotent (safe to run multiple times)
- It only migrates if `business_settings` table is empty
- Default values are used if no data exists in `site_settings`
- The `business_settings` table supports additional fields like `tax_id`, `language`, and `settings` JSONB for future extensibility

