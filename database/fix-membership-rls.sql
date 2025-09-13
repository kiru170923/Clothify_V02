-- Fix RLS policies for membership system
-- Run this in your Supabase SQL Editor

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own tokens" ON user_tokens;
DROP POLICY IF EXISTS "Only admins can manage tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can view own membership" ON user_memberships;
DROP POLICY IF EXISTS "Only admins can manage memberships" ON user_memberships;
DROP POLICY IF EXISTS "Users can view own token history" ON token_usage_history;
DROP POLICY IF EXISTS "Only admins can manage token history" ON token_usage_history;

-- 2. Create proper RLS policies for user_tokens
CREATE POLICY "Users can view own tokens" ON user_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON user_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON user_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to do everything (for API operations)
CREATE POLICY "Service role can manage all tokens" ON user_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Create proper RLS policies for user_memberships
CREATE POLICY "Users can view own membership" ON user_memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all memberships" ON user_memberships
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Create proper RLS policies for token_usage_history
CREATE POLICY "Users can view own token history" ON token_usage_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all token history" ON token_usage_history
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Grant necessary permissions
GRANT ALL ON user_tokens TO authenticated;
GRANT ALL ON user_memberships TO authenticated;
GRANT ALL ON token_usage_history TO authenticated;

-- 6. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_tokens', 'user_memberships', 'token_usage_history')
ORDER BY tablename, policyname;
