-- Fix images table to enable history saving for try-on results
-- Run this in Supabase SQL Editor

-- 1. Add missing columns if they don't exist
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS task_id TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'kieai';

-- 2. Make person_image_url and clothing_image_url nullable 
-- (they might not always be available from task metadata)
ALTER TABLE images 
ALTER COLUMN person_image_url DROP NOT NULL,
ALTER COLUMN clothing_image_url DROP NOT NULL;

-- 3. Drop existing RLS policies that might be too restrictive
DROP POLICY IF EXISTS "Users can insert own images" ON images;
DROP POLICY IF EXISTS "Users can view own images" ON images;
DROP POLICY IF EXISTS "Users can update own images" ON images;
DROP POLICY IF EXISTS "Users can delete own images" ON images;

-- 4. Create more permissive RLS policies
-- Allow authenticated users to insert (for server-side inserts with supabaseAdmin)
CREATE POLICY "Authenticated users can insert images" ON images
  FOR INSERT 
  WITH CHECK (true);

-- Users can only view their own images
CREATE POLICY "Users can view own images" ON images
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only update their own images
CREATE POLICY "Users can update own images" ON images
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own images
CREATE POLICY "Users can delete own images" ON images
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Ensure RLS is enabled (but with permissive insert policy)
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions
GRANT ALL ON images TO authenticated;
GRANT ALL ON images TO service_role;

-- 7. Create index on task_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_images_task_id ON images(task_id);

-- 8. Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'images' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'images'
ORDER BY policyname;

