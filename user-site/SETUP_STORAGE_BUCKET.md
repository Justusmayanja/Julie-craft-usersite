# 🚨 URGENT: Setup Storage Bucket

## The Error You're Seeing

```
Storage upload error: [Error [StorageApiError]: Bucket not found] {
  __isStorageError: true,
  status: 400,
  statusCode: '404'
}
```

This means the Supabase Storage bucket `profile-images` hasn't been created yet.

## 🔧 Quick Fix

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **SQL Editor** (in the left sidebar)

### Step 2: Run This SQL Script
Copy and paste this SQL script into the SQL Editor and click **Run**:

```sql
-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for profile images bucket
CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view all profile images (they're public)
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: Verify Setup
After running the script, verify the bucket was created:

```sql
SELECT * FROM storage.buckets WHERE id = 'profile-images';
```

You should see a row with:
- `id`: `profile-images`
- `name`: `profile-images` 
- `public`: `true`

## ✅ After Setup

Once the bucket is created, the profile image upload will work perfectly!

## 🎯 New Behavior

**Before**: Image uploaded immediately when selected
**Now**: Image preview shows when selected, but only uploads when you click "Save Changes"

This gives you control over when the upload happens and allows you to cancel changes if needed.
