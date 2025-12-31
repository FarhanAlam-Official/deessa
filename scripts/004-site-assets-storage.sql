-- =============================================
-- SITE ASSETS STORAGE BUCKETS FOR ADMIN CONTROL
-- Run this after 003-storage-setup.sql
-- =============================================

-- Create storage buckets for site-wide assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('hero-images', 'hero-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  ('site-assets', 'site-assets', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('press-gallery', 'press-gallery', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  ('og-images', 'og-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PUBLIC READ POLICIES
-- =============================================

-- Public can view hero images
CREATE POLICY "Public can view hero images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-images');

-- Public can view site assets
CREATE POLICY "Public can view site assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Public can view press gallery
CREATE POLICY "Public can view press gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'press-gallery');

-- Public can view OG images
CREATE POLICY "Public can view og images"
ON storage.objects FOR SELECT
USING (bucket_id = 'og-images');

-- =============================================
-- AUTHENTICATED ADMIN UPLOAD POLICIES
-- =============================================

-- Authenticated users can upload hero images
CREATE POLICY "Authenticated users can upload hero images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hero-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can upload site assets
CREATE POLICY "Authenticated users can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can upload press gallery images
CREATE POLICY "Authenticated users can upload press gallery"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'press-gallery' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can upload OG images
CREATE POLICY "Authenticated users can upload og images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'og-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- UPDATE POLICIES (for replacing images)
-- =============================================

-- Authenticated users can update their hero images
CREATE POLICY "Authenticated users can update hero images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hero-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update site assets
CREATE POLICY "Authenticated users can update site assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update press gallery
CREATE POLICY "Authenticated users can update press gallery"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'press-gallery' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update OG images
CREATE POLICY "Authenticated users can update og images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'og-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- DELETE POLICIES
-- =============================================

-- Authenticated users can delete their hero images
CREATE POLICY "Authenticated users can delete hero images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hero-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete site assets
CREATE POLICY "Authenticated users can delete site assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete press gallery
CREATE POLICY "Authenticated users can delete press gallery"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'press-gallery' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete OG images
CREATE POLICY "Authenticated users can delete og images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'og-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- NOTES
-- =============================================
-- hero-images: 10MB limit for page hero sections
-- site-assets: 5MB limit for logos, favicons, general images
-- press-gallery: 10MB limit for press media photos
-- og-images: 5MB limit for social sharing images
