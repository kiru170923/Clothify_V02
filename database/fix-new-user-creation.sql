-- Fix new user creation issue
-- Run this in your Supabase SQL Editor

-- 1. Check if trigger exists and drop it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create improved function for user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into users table with proper error handling
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    image_url, 
    provider, 
    provider_id,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'google',
    new.id::text,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();
  
  -- Insert into user_tokens table for new users
  INSERT INTO public.user_tokens (
    user_id,
    total_tokens,
    used_tokens,
    last_reset_date,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    5, -- Give 5 free tokens to new users
    0,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING; -- Don't update if already exists
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error creating user record: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix RLS policies for users table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;

-- Create new policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 5. Fix RLS policies for user_tokens table
DROP POLICY IF EXISTS "Users can view own tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON user_tokens;
DROP POLICY IF EXISTS "Service role can manage all tokens" ON user_tokens;

-- Create new policies
CREATE POLICY "Users can view own tokens" ON user_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON user_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON user_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all tokens" ON user_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- 6. Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_tokens TO authenticated;

-- 7. Verify setup
SELECT 
  'Trigger created' as status,
  COUNT(*) as count
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'

UNION ALL

SELECT 
  'Function created' as status,
  COUNT(*) as count
FROM pg_proc 
WHERE proname = 'handle_new_user';
