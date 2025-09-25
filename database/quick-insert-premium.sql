-- Quick insert Premium membership plan
-- Copy and paste this into Supabase SQL Editor

INSERT INTO membership_plans (
  id,
  name, 
  description, 
  price_monthly, 
  price_yearly, 
  tokens_monthly, 
  tokens_yearly, 
  features,
  is_active
) VALUES (
  '4344d556-1116-466f-a8ef-318a63a2e433',
  'Premium',
  'Gói cao cấp cho người dùng chuyên nghiệp với nhiều tính năng độc quyền',
  159000,
  1526400,
  100,
  1200,
  '["100 ảnh/tháng", "Chất lượng 4K", "Hỗ trợ 24/7", "Lưu trữ không giới hạn", "API access", "Ưu tiên xử lý", "Tính năng nâng cao"]',
  true
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

-- Check if inserted successfully
SELECT * FROM membership_plans WHERE id = '4344d556-1116-466f-a8ef-318a63a2e433';
