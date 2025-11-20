-- Migration: Setup Supabase Storage Buckets for Products and Categories
-- Date: 2025
-- Description: Creates storage buckets for product and category images
--              Run this in your Supabase SQL Editor

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products', 
  'products', 
  true, 
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for media (categories, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 
  'media', 
  true, 
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Alternative: Create a separate 'categories' bucket if preferred
-- Uncomment the following if you want a separate categories bucket instead of using 'media'
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'categories', 
  'categories', 
  true, 
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
*/

-- RLS Policies for products bucket
-- Note: Service role (used in API routes) bypasses RLS, but these policies allow public access

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for products" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from products bucket" ON storage.objects;

-- Allow public read access to product images
CREATE POLICY "Public read access for products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated users and service role to upload product images
CREATE POLICY "Allow uploads to products bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products');

-- Allow authenticated users and service role to update product images
CREATE POLICY "Allow updates to products bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products');

-- Allow authenticated users and service role to delete product images
CREATE POLICY "Allow deletes from products bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'products');

-- RLS Policies for media bucket (categories)
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for media" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from media bucket" ON storage.objects;

-- Allow public read access to media
CREATE POLICY "Public read access for media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users and service role to upload media
CREATE POLICY "Allow uploads to media bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media');

-- Allow authenticated users and service role to update media
CREATE POLICY "Allow updates to media bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media');

-- Allow authenticated users and service role to delete media
CREATE POLICY "Allow deletes from media bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'media');

-- Verify buckets were created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('products', 'media')
ORDER BY id;

