-- Migration script for existing users to add token records
-- Run this in your Supabase SQL editor after creating the membership schema

-- 1. Create token records for all existing users who don't have one
INSERT INTO user_tokens (user_id, total_tokens, used_tokens, last_reset_date)
SELECT 
  u.id,
  5, -- Give 5 free tokens to existing users
  0, -- They haven't used any tokens yet
  NOW() -- Set reset date to now
FROM users u
LEFT JOIN user_tokens ut ON u.id = ut.user_id
WHERE ut.id IS NULL; -- Only insert for users who don't have token records

-- 2. Verify the migration
SELECT 
  COUNT(*) as total_users,
  COUNT(ut.id) as users_with_tokens,
  COUNT(*) - COUNT(ut.id) as users_without_tokens
FROM users u
LEFT JOIN user_tokens ut ON u.id = ut.user_id;

-- 3. Show token distribution
SELECT 
  'Users with tokens' as status,
  COUNT(*) as count
FROM user_tokens
UNION ALL
SELECT 
  'Users without tokens' as status,
  COUNT(*) as count
FROM users u
LEFT JOIN user_tokens ut ON u.id = ut.user_id
WHERE ut.id IS NULL;

-- 4. Optional: Give bonus tokens to very old users (created more than 30 days ago)
UPDATE user_tokens 
SET total_tokens = 10 -- Give 10 tokens instead of 5
WHERE user_id IN (
  SELECT u.id 
  FROM users u 
  WHERE u.created_at < NOW() - INTERVAL '30 days'
);

-- 5. Final verification
SELECT 
  'Migration completed' as status,
  COUNT(*) as total_token_records,
  SUM(total_tokens) as total_tokens_given,
  SUM(used_tokens) as total_tokens_used
FROM user_tokens;
