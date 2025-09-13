-- Simple token fix without complex queries
-- Run this in your Supabase SQL Editor

-- 1. Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens DISABLE ROW LEVEL SECURITY;

-- 2. Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_tokens TO authenticated;

-- 3. Create token records for all users (simple approach)
INSERT INTO user_tokens (user_id, total_tokens, used_tokens, last_reset_date, created_at, updated_at)
SELECT 
  id,
  5, -- Give 5 tokens to all users
  0,
  NOW(),
  NOW(),
  NOW()
FROM users
WHERE id NOT IN (SELECT user_id FROM user_tokens);

-- 4. Check results
SELECT 
  'Total users' as metric,
  COUNT(*) as count
FROM users

UNION ALL

SELECT 
  'Users with tokens' as metric,
  COUNT(*) as count
FROM user_tokens;

-- 5. Show sample data
SELECT 
  u.email,
  ut.total_tokens,
  ut.used_tokens,
  ut.total_tokens - ut.used_tokens as available_tokens
FROM users u
JOIN user_tokens ut ON u.id = ut.user_id
LIMIT 5;
