-- Complete fix for membership system
-- Run this in Supabase SQL Editor

-- Step 1: Create membership_plans table if not exists
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  tokens_monthly INTEGER NOT NULL,
  tokens_yearly INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert membership plans if not exists
INSERT INTO membership_plans (name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features) 
SELECT * FROM (VALUES
  ('Standard', 'Gói cơ bản cho người dùng mới', 59000, 566400, 30, 360, '["30 ảnh/tháng", "Chất lượng HD", "Hỗ trợ email"]'::jsonb),
  ('Medium', 'Gói phổ biến cho người dùng thường xuyên', 99000, 950400, 50, 600, '["50 ảnh/tháng", "Chất lượng HD+", "Hỗ trợ ưu tiên", "Lưu trữ 100 ảnh"]'::jsonb),
  ('Premium', 'Gói cao cấp cho người dùng chuyên nghiệp', 159000, 1526400, 100, 1200, '["100 ảnh/tháng", "Chất lượng 4K", "Hỗ trợ 24/7", "Lưu trữ không giới hạn", "API access"]'::jsonb)
) AS v(name, description, price_monthly, price_yearly, tokens_monthly, tokens_yearly, features)
WHERE NOT EXISTS (SELECT 1 FROM membership_plans WHERE name = v.name);

-- Step 3: Clean up invalid plan_id references in user_memberships
UPDATE user_memberships 
SET plan_id = NULL 
WHERE plan_id IS NOT NULL 
  AND plan_id NOT IN (SELECT id FROM membership_plans);

-- Step 4: Remove existing foreign key constraint if exists
ALTER TABLE user_memberships DROP CONSTRAINT IF EXISTS user_memberships_plan_id_fkey;

-- Step 5: Add foreign key constraint
ALTER TABLE user_memberships 
ADD CONSTRAINT user_memberships_plan_id_fkey 
FOREIGN KEY (plan_id) REFERENCES membership_plans(id);

-- Step 6: Delete invalid plan_id references in payment_orders
DELETE FROM payment_orders
WHERE plan_id IS NOT NULL
  AND plan_id NOT IN (SELECT id FROM membership_plans);

-- Step 7: Remove existing foreign key constraint for payment_orders if exists
ALTER TABLE payment_orders DROP CONSTRAINT IF EXISTS payment_orders_plan_id_fkey;

-- Step 8: Add foreign key constraint for payment_orders
ALTER TABLE payment_orders
ADD CONSTRAINT payment_orders_plan_id_fkey
FOREIGN KEY (plan_id) REFERENCES membership_plans(id);

-- Step 9: Enable RLS on membership_plans
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

-- Step 10: Create policies
DROP POLICY IF EXISTS "Membership plans are viewable by authenticated users" ON membership_plans;
CREATE POLICY "Membership plans are viewable by authenticated users" ON membership_plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- Step 11: Grant permissions
GRANT ALL ON public.membership_plans TO authenticated;

-- Step 12: Verify the setup
SELECT 
  'membership_plans' as table_name,
  COUNT(*) as record_count
FROM membership_plans
UNION ALL
SELECT 
  'user_memberships' as table_name,
  COUNT(*) as record_count
FROM user_memberships
UNION ALL
SELECT 
  'payment_orders' as table_name,
  COUNT(*) as record_count
FROM payment_orders;

-- Step 13: Test the relationship for user_memberships
SELECT 
    um.id,
    um.user_id,
    um.plan_id,
    mp.name as plan_name,
    mp.tokens_monthly,
    mp.tokens_yearly
FROM user_memberships um
LEFT JOIN membership_plans mp ON um.plan_id = mp.id
LIMIT 5;

-- Step 14: Test the relationship for payment_orders
SELECT
    po.id,
    po.order_id,
    po.user_id,
    po.plan_id,
    mp.name as plan_name,
    po.amount
FROM payment_orders po
LEFT JOIN membership_plans mp ON po.plan_id = mp.id
LIMIT 5;
