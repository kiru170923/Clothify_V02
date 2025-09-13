-- Complete token system fix
-- Run this in your Supabase SQL Editor to fix all token issues

-- 1. First, disable RLS to avoid permission issues
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans DISABLE ROW LEVEL SECURITY;

-- 2. Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_tokens TO authenticated;
GRANT ALL ON user_memberships TO authenticated;
GRANT ALL ON token_usage_history TO authenticated;
GRANT ALL ON membership_plans TO authenticated;

-- 3. Check current state
SELECT 
  '=== BEFORE FIX ===' as status,
  'Total users' as metric,
  COUNT(*) as count
FROM users

UNION ALL

SELECT 
  '=== BEFORE FIX ===' as status,
  'Users with tokens' as metric,
  COUNT(*) as count
FROM user_tokens

UNION ALL

SELECT 
  '=== BEFORE FIX ===' as status,
  'Users without tokens' as metric,
  COUNT(*) as count
FROM users u
LEFT JOIN user_tokens ut ON u.id = ut.user_id
WHERE ut.id IS NULL;

-- 4. Create token records for all users who don't have one
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
WHERE ut.id IS NULL;

-- 5. Insert membership plans if they don't exist
INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features, is_active)
SELECT * FROM (VALUES
  ('Standard', 'Gói cơ bản cho người dùng mới', 59000, 566400, 30, 360, '["30 ảnh/tháng", "Chất lượng HD", "Hỗ trợ email"]'::jsonb, true),
  ('Medium', 'Gói phổ biến cho người dùng thường xuyên', 99000, 950400, 50, 600, '["50 ảnh/tháng", "Chất lượng HD+", "Hỗ trợ ưu tiên", "Lưu trữ 100 ảnh"]'::jsonb, true),
  ('Premium', 'Gói cao cấp cho người dùng chuyên nghiệp', 159000, 1526400, 100, 1200, '["100 ảnh/tháng", "Chất lượng 4K", "Hỗ trợ 24/7", "Lưu trữ không giới hạn", "API access"]'::jsonb, true)
) AS v(name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features, is_active)
WHERE NOT EXISTS (SELECT 1 FROM membership_plans WHERE name = v.name);

-- 6. Check final state
SELECT 
  '=== AFTER FIX ===' as status,
  'Total users' as metric,
  COUNT(*) as count
FROM users

UNION ALL

SELECT 
  '=== AFTER FIX ===' as status,
  'Users with tokens' as metric,
  COUNT(*) as count
FROM user_tokens

UNION ALL

SELECT 
  '=== AFTER FIX ===' as status,
  'Users without tokens' as metric,
  COUNT(*) as count
FROM users u
LEFT JOIN user_tokens ut ON u.id = ut.user_id
WHERE ut.id IS NULL

UNION ALL

SELECT 
  '=== AFTER FIX ===' as status,
  'Membership plans' as metric,
  COUNT(*) as count
FROM membership_plans;

-- 7. Show token distribution
SELECT 
  'Token distribution' as info,
  total_tokens,
  COUNT(*) as user_count
FROM user_tokens
GROUP BY total_tokens
ORDER BY total_tokens;

-- 8. Show sample user data
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

-- 9. Show membership plans
SELECT 
  name,
  price_monthly,
  tokens_monthly,
  features
FROM membership_plans
ORDER BY price_monthly;
