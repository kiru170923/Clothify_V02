-- Create token records for all existing users
-- Run this in your Supabase SQL Editor

-- 1. Check current state
SELECT 
  'Total users' as metric,
  COUNT(*) as count
FROM users

UNION ALL

SELECT 
  'Users with tokens' as metric,
  COUNT(*) as count
FROM user_tokens

UNION ALL

SELECT 
  'Users without tokens' as metric,
  COUNT(*) as count
FROM users u
LEFT JOIN user_tokens ut ON u.id = ut.user_id
WHERE ut.id IS NULL;

-- 2. Create token records for all users who don't have one
INSERT INTO user_tokens (user_id, total_tokens, used_tokens, last_reset_date, created_at, updated_at)
SELECT 
  u.id,
  CASE 
    WHEN u.created_at < NOW() - INTERVAL '30 days' THEN 10  -- Old users get 10 tokens
    ELSE 5  -- New users get 5 tokens
  END,
  0,
  NOW(),
  NOW(),
  NOW()
FROM users u
LEFT JOIN user_tokens ut ON u.id = ut.user_id
WHERE ut.id IS NULL; -- Only insert for users who don't have token records

-- 3. Verify the results
SELECT 
  'After migration - Total users' as metric,
  COUNT(*) as count
FROM users

UNION ALL

SELECT 
  'After migration - Users with tokens' as metric,
  COUNT(*) as count
FROM user_tokens

UNION ALL

SELECT 
  'After migration - Users without tokens' as metric,
  COUNT(*) as count
FROM users u
LEFT JOIN user_tokens ut ON u.id = ut.user_id
WHERE ut.id IS NULL;

-- 4. Show token distribution
SELECT 
  'Token distribution' as info,
  total_tokens,
  COUNT(*) as user_count
FROM user_tokens
GROUP BY total_tokens
ORDER BY total_tokens;

-- 5. Show sample data
SELECT 
  u.email,
  u.name,
  ut.total_tokens,
  ut.used_tokens,
  ut.total_tokens - ut.used_tokens as available_tokens,
  u.created_at as user_created_at
FROM users u
JOIN user_tokens ut ON u.id = ut.user_id
ORDER BY u.created_at DESC
LIMIT 10;
