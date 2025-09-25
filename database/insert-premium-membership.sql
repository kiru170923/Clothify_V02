-- Insert Premium Membership Plan with specific ID
-- Run this in your Supabase SQL editor

INSERT INTO membership_plans (
  id,
  name, 
  description, 
  price_monthly, 
  price_yearly, 
  tokens_monthly, 
  tokens_yearly, 
  features,
  is_active,
  created_at,
  updated_at
) VALUES (
  '4344d556-1116-466f-a8ef-318a63a2e433',
  'Premium',
  'Gói cao cấp cho người dùng chuyên nghiệp với nhiều tính năng độc quyền',
  159000,  -- 159,000 VND monthly
  1526400, -- 1,526,400 VND yearly (monthly * 12 * 0.8)
  100,     -- 100 tokens per month
  1200,    -- 1200 tokens per year
  '["100 ảnh/tháng", "Chất lượng 4K", "Hỗ trợ 24/7", "Lưu trữ không giới hạn", "API access", "Ưu tiên xử lý", "Tính năng nâng cao"]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  tokens_monthly = EXCLUDED.tokens_monthly,
  tokens_yearly = EXCLUDED.tokens_yearly,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the insertion
SELECT 
  id,
  name,
  description,
  price_monthly,
  price_yearly,
  tokens_monthly,
  tokens_yearly,
  features,
  is_active,
  created_at
FROM membership_plans 
WHERE id = '4344d556-1116-466f-a8ef-318a63a2e433';
