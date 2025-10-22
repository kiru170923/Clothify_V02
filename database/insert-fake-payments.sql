-- Insert fake payment data with random user assignments
-- 6 payment transactions as specified

-- First, get list of existing users (if no users, this will be empty)
-- Data to insert:
-- 1. Clothify Membership - 99,000 - 05-10-2025 16:49:48 - Medium tháng
-- 2. Clothify Membership - 15,000 - 05-10-2025 16:47:28 - Mua 30 tokens
-- 3. Clothify Membership - 59,000 - 02-10-2025 10:43:33 - Standard tháng
-- 4. Clothify Membership - 59,000 - 02-10-2025 10:33:19 - Standard tháng
-- 5. Clothify Membership - 59,000 - 02-10-2025 10:30:49 - Standard tháng
-- 6. Clothify Membership - 159,000 - 02-10-2025 10:29:46 - Premium tháng

-- Disable RLS temporarily to allow inserts
ALTER TABLE payment_orders DISABLE ROW LEVEL SECURITY;

-- Delete existing test data first (optional)
DELETE FROM payment_orders WHERE order_id IN (
  '1759658697', '1759657681', '1759376885', 
  '1759376875', '1759376049', '1759376024'
);

-- Get random user IDs and insert payments
INSERT INTO payment_orders (
  order_id,
  user_id,
  plan_id,
  billing_cycle,
  amount,
  status,
  payment_method,
  payment_url,
  order_info,
  external_order_code,
  created_at,
  tokens_to_add
)
SELECT 
  order_id,
  (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1) as user_id,
  CASE 
    WHEN plan_name = 'Medium' THEN (SELECT id FROM membership_plans WHERE name = 'Medium' LIMIT 1)
    WHEN plan_name = 'Standard' THEN (SELECT id FROM membership_plans WHERE name = 'Standard' LIMIT 1)
    WHEN plan_name = 'Premium' THEN (SELECT id FROM membership_plans WHERE name = 'Premium' LIMIT 1)
    ELSE NULL
  END as plan_id,
  CASE
    WHEN plan_name = 'Token' THEN NULL
    ELSE billing_cycle
  END as billing_cycle,
  amount,
  'completed' as status,
  'payos' as payment_method,
  'https://payos.vn/payment' as payment_url,
  plan_name as order_info,
  order_id as external_order_code,
  created_at,
  CASE
    WHEN plan_name = 'Token' THEN 30::INTEGER
    ELSE NULL
  END as tokens_to_add
FROM (
  VALUES 
    ('1759658697'::VARCHAR, 'Medium'::VARCHAR, 'monthly'::VARCHAR, 99000::INTEGER, '2025-10-05 16:49:48'::TIMESTAMP),
    ('1759657681'::VARCHAR, 'Token'::VARCHAR, 'monthly'::VARCHAR, 15000::INTEGER, '2025-10-05 16:47:28'::TIMESTAMP),
    ('1759376885'::VARCHAR, 'Standard'::VARCHAR, 'monthly'::VARCHAR, 59000::INTEGER, '2025-10-02 10:43:33'::TIMESTAMP),
    ('1759376875'::VARCHAR, 'Standard'::VARCHAR, 'monthly'::VARCHAR, 59000::INTEGER, '2025-10-02 10:33:19'::TIMESTAMP),
    ('1759376049'::VARCHAR, 'Standard'::VARCHAR, 'monthly'::VARCHAR, 59000::INTEGER, '2025-10-02 10:30:49'::TIMESTAMP),
    ('1759376024'::VARCHAR, 'Premium'::VARCHAR, 'monthly'::VARCHAR, 159000::INTEGER, '2025-10-02 10:29:46'::TIMESTAMP)
) AS data(order_id, plan_name, billing_cycle, amount, created_at)
WHERE (SELECT COUNT(*) FROM auth.users) > 0;

-- Re-enable RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Verify inserted data
SELECT 
  po.order_id,
  po.amount,
  po.status,
  po.created_at,
  po.order_info,
  mp.name as plan_name,
  po.tokens_to_add,
  au.email as user_email
FROM payment_orders po
LEFT JOIN membership_plans mp ON po.plan_id = mp.id
LEFT JOIN auth.users au ON po.user_id = au.id
WHERE po.order_id IN (
  '1759658697', '1759657681', '1759376885', 
  '1759376875', '1759376049', '1759376024'
)
ORDER BY po.created_at DESC;
