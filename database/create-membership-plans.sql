-- Create membership plans separately
-- Run this in your Supabase SQL Editor

-- 1. Disable RLS for membership_plans
ALTER TABLE membership_plans DISABLE ROW LEVEL SECURITY;
GRANT ALL ON membership_plans TO authenticated;

-- 2. Insert membership plans one by one (check if exists first)
INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features, is_active)
SELECT 
  'Standard',
  'Gói cơ bản cho người dùng mới',
  59000,
  566400,
  30,
  360,
  '["30 ảnh/tháng", "Chất lượng HD", "Hỗ trợ email"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM membership_plans WHERE name = 'Standard');

INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features, is_active)
SELECT 
  'Medium',
  'Gói phổ biến cho người dùng thường xuyên',
  99000,
  950400,
  50,
  600,
  '["50 ảnh/tháng", "Chất lượng HD+", "Hỗ trợ ưu tiên", "Lưu trữ 100 ảnh"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM membership_plans WHERE name = 'Medium');

INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features, is_active)
SELECT 
  'Premium',
  'Gói cao cấp cho người dùng chuyên nghiệp',
  159000,
  1526400,
  100,
  1200,
  '["100 ảnh/tháng", "Chất lượng 4K", "Hỗ trợ 24/7", "Lưu trữ không giới hạn", "API access"]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM membership_plans WHERE name = 'Premium');

-- 3. Check results
SELECT 
  name,
  price_monthly,
  tokens_monthly,
  features
FROM membership_plans
ORDER BY price_monthly;
