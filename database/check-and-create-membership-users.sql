-- Check current membership users count
SELECT 
  COUNT(DISTINCT po.user_id) as total_membership_users,
  COUNT(DISTINCT po.id) as total_payments,
  STRING_AGG(DISTINCT au.email, ', ') as user_emails
FROM payment_orders po
LEFT JOIN auth.users au ON po.user_id = au.id
WHERE po.status = 'completed';

-- ============================================
-- CREATE FAKE MEMBERSHIP USERS LINKED TO PAYMENTS
-- ============================================

-- Step 1: Check payment counts by plan
SELECT 
  mp.name as plan_name,
  COUNT(po.id) as payment_count,
  SUM(po.amount) as total_amount,
  STRING_AGG(po.order_id, ', ') as order_ids
FROM payment_orders po
LEFT JOIN membership_plans mp ON po.plan_id = mp.id
WHERE po.status = 'completed' AND po.plan_id IS NOT NULL
GROUP BY mp.name
ORDER BY payment_count DESC;

-- Step 2: Count token purchases
SELECT 
  'Token Purchase' as type,
  COUNT(po.id) as count,
  SUM(po.amount) as total_amount,
  SUM(po.tokens_to_add) as total_tokens
FROM payment_orders po
WHERE po.status = 'completed' AND po.tokens_to_add IS NOT NULL;

-- ============================================
-- Summary: Calculate membership user count
-- ============================================
SELECT 
  (SELECT COUNT(DISTINCT user_id) FROM payment_orders WHERE status = 'completed' AND plan_id IS NOT NULL) as membership_users,
  (SELECT COUNT(DISTINCT user_id) FROM payment_orders WHERE status = 'completed' AND tokens_to_add IS NOT NULL) as token_only_users,
  (SELECT COUNT(DISTINCT user_id) FROM payment_orders WHERE status = 'completed') as total_paying_users,
  (SELECT COUNT(*) FROM auth.users) as total_users;
