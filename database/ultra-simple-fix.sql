-- Ultra simple fix - no complex queries
-- Run this in your Supabase SQL Editor

-- 1. Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans DISABLE ROW LEVEL SECURITY;

-- 2. Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_tokens TO authenticated;
GRANT ALL ON membership_plans TO authenticated;

-- 3. Create tokens for all users (simple)
INSERT INTO user_tokens (user_id, total_tokens, used_tokens, last_reset_date, created_at, updated_at)
SELECT 
  id,
  5,
  0,
  NOW(),
  NOW(),
  NOW()
FROM users
WHERE id NOT IN (SELECT user_id FROM user_tokens WHERE user_id IS NOT NULL);

-- 4. Create membership plans (simple)
INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features, is_active)
VALUES (
  'Standard',
  'Gói cơ bản cho người dùng mới',
  59000,
  566400,
  30,
  360,
  '["30 ảnh/tháng", "Chất lượng HD", "Hỗ trợ email"]'::jsonb,
  true
);

INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features, is_active)
VALUES (
  'Medium',
  'Gói phổ biến cho người dùng thường xuyên',
  99000,
  950400,
  50,
  600,
  '["50 ảnh/tháng", "Chất lượng HD+", "Hỗ trợ ưu tiên", "Lưu trữ 100 ảnh"]'::jsonb,
  true
);

INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features, is_active)
VALUES (
  'Premium',
  'Gói cao cấp cho người dùng chuyên nghiệp',
  159000,
  1526400,
  100,
  1200,
  '["100 ảnh/tháng", "Chất lượng 4K", "Hỗ trợ 24/7", "Lưu trữ không giới hạn", "API access"]'::jsonb,
  true
);

-- 5. Check results
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'User Tokens' as table_name, COUNT(*) as count FROM user_tokens
UNION ALL
SELECT 'Membership Plans' as table_name, COUNT(*) as count FROM membership_plans;
