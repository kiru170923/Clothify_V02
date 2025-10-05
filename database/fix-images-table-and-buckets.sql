-- Fix images table structure and recreate missing storage buckets
-- Run this in Supabase SQL Editor

-- 1. First, let's check and fix the images table structure
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS task_id TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'kieai';

-- Make person_image_url and clothing_image_url nullable since they might not always be available
ALTER TABLE images 
ALTER COLUMN person_image_url DROP NOT NULL,
ALTER COLUMN clothing_image_url DROP NOT NULL;

-- 2. Recreate missing storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('person-images', 'person-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('clothing-images', 'clothing-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('result-images', 'result-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('user-uploads', 'user-uploads', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 3. Recreate storage policies for the buckets
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can upload person images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload clothing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload result images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Create new policies
CREATE POLICY "Users can upload person images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'person-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload clothing images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'clothing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload result images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'result-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload to user-uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('person-images', 'clothing-images', 'result-images', 'user-uploads'));

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (bucket_id IN ('person-images', 'clothing-images', 'result-images', 'user-uploads') AND auth.role() = 'authenticated');

-- 4. Check current images table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'images' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check existing buckets
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('person-images', 'clothing-images', 'result-images', 'user-uploads');

-- 6. Test insert to verify the structure works
-- (This will be commented out - uncomment to test with real user ID)
-- INSERT INTO images (user_id, task_id, result_image_url, status, provider) 
-- VALUES ('your-user-id-here', 'test-task-123', 'https://example.com/test.jpg', 'completed', 'kieai');
