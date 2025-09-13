-- Disable all RLS temporarily to fix authentication issues
-- Run this in your Supabase SQL Editor

-- Disable RLS for all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON images TO authenticated;
GRANT ALL ON user_tokens TO authenticated;
GRANT ALL ON user_memberships TO authenticated;
GRANT ALL ON token_usage_history TO authenticated;
GRANT ALL ON membership_plans TO authenticated;

-- Verify RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'images', 'user_tokens', 'user_memberships', 'token_usage_history', 'membership_plans')
ORDER BY tablename;
