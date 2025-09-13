-- Fix RLS Policies for Supabase
-- Run this in your Supabase SQL editor to fix upload errors

-- 1. Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own images" ON images;
DROP POLICY IF EXISTS "Users can insert own images" ON images;
DROP POLICY IF EXISTS "Users can update own images" ON images;
DROP POLICY IF EXISTS "Users can delete own images" ON images;

-- 2. Drop storage policies
DROP POLICY IF EXISTS "Users can upload person images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload clothing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload result images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- 3. Create function to handle user creation from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, image_url, provider, provider_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'google',
    new.id::text
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create new RLS policies for users table
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Enable update for authenticated users" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- 6. Create new RLS policies for images table
CREATE POLICY "Enable read access for authenticated users" ON images
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Enable insert for authenticated users" ON images
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable update for authenticated users" ON images
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Enable delete for authenticated users" ON images
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 7. Create new storage policies
CREATE POLICY "Enable insert for authenticated users" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id IN ('person-images', 'clothing-images', 'result-images')
  );

CREATE POLICY "Enable select for all users" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('person-images', 'clothing-images', 'result-images')
  );

CREATE POLICY "Enable update for authenticated users" ON storage.objects
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    bucket_id IN ('person-images', 'clothing-images', 'result-images')
  );

CREATE POLICY "Enable delete for authenticated users" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    bucket_id IN ('person-images', 'clothing-images', 'result-images')
  );

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.images TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
