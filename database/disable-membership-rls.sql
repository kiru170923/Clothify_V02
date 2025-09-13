-- Temporarily disable RLS for membership tables to fix the issue
-- Run this in your Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE user_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_history DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON user_tokens TO authenticated;
GRANT ALL ON user_memberships TO authenticated;
GRANT ALL ON token_usage_history TO authenticated;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_tokens', 'user_memberships', 'token_usage_history');
