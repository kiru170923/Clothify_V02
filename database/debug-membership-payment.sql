-- Debug membership payment issue
-- Run this in Supabase SQL Editor to check what happened

-- 1. Check recent payment orders for membership
SELECT 
  id,
  user_id,
  plan_id,
  status,
  amount,
  billing_cycle,
  tokens_to_add,
  external_order_code,
  created_at,
  updated_at
FROM payment_orders
WHERE plan_id IS NOT NULL  -- Membership orders
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if user_memberships was created
SELECT 
  um.id,
  um.user_id,
  um.plan_id,
  mp.name as plan_name,
  um.status,
  um.start_date,
  um.end_date,
  um.billing_cycle,
  um.created_at
FROM user_memberships um
LEFT JOIN membership_plans mp ON um.plan_id = mp.id
ORDER BY um.created_at DESC
LIMIT 10;

-- 3. Check tokens added
SELECT 
  user_id,
  total_tokens,
  used_tokens,
  last_reset_date,
  updated_at
FROM user_tokens
ORDER BY updated_at DESC
LIMIT 10;

-- 4. Check specific user (replace with actual email)
-- SELECT 
--   u.id as user_id,
--   u.email,
--   ut.total_tokens,
--   um.plan_id,
--   mp.name as current_plan,
--   um.status as membership_status,
--   um.end_date
-- FROM auth.users u
-- LEFT JOIN user_tokens ut ON u.id = ut.user_id
-- LEFT JOIN user_memberships um ON u.id = um.user_id AND um.status = 'active'
-- LEFT JOIN membership_plans mp ON um.plan_id = mp.id
-- WHERE u.email = 'YOUR_EMAIL_HERE';

