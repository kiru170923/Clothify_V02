-- RLS Fix - No owner permissions needed
-- Run this in Supabase SQL Editor

-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('person-images', 'person-images', true),
  ('clothing-images', 'clothing-images', true),
  ('result-images', 'result-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop all existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can upload person images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload clothing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload result images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable select for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public view" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- 3. Create very permissive policies (no owner permissions needed)
CREATE POLICY "Allow authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow public view" ON storage.objects
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update" ON storage.objects
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated');
