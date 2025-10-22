-- ============================================
-- ASSIGN 6 PAYMENTS TO REAL USERS
-- ============================================

-- Disable RLS temporarily
ALTER TABLE payment_orders DISABLE ROW LEVEL SECURITY;

-- Get the first 6 users
WITH user_list AS (
  SELECT id, email, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM auth.users
  LIMIT 6
)
UPDATE payment_orders po
SET user_id = (SELECT id FROM user_list WHERE rn = 1)
WHERE po.order_id = '1759658697';

WITH user_list AS (
  SELECT id, email, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM auth.users
  LIMIT 6
)
UPDATE payment_orders po
SET user_id = (SELECT id FROM user_list WHERE rn = 2)
WHERE po.order_id = '1759657681';

WITH user_list AS (
  SELECT id, email, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM auth.users
  LIMIT 6
)
UPDATE payment_orders po
SET user_id = (SELECT id FROM user_list WHERE rn = 3)
WHERE po.order_id = '1759376885';

WITH user_list AS (
  SELECT id, email, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM auth.users
  LIMIT 6
)
UPDATE payment_orders po
SET user_id = (SELECT id FROM user_list WHERE rn = 4)
WHERE po.order_id = '1759376875';

WITH user_list AS (
  SELECT id, email, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM auth.users
  LIMIT 6
)
UPDATE payment_orders po
SET user_id = (SELECT id FROM user_list WHERE rn = 5)
WHERE po.order_id = '1759376049';

WITH user_list AS (
  SELECT id, email, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM auth.users
  LIMIT 6
)
UPDATE payment_orders po
SET user_id = (SELECT id FROM user_list WHERE rn = 6)
WHERE po.order_id = '1759376024';

-- Re-enable RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFY RESULTS
-- ============================================

-- Result 1: Check membership user count
SELECT 
  'Membership Users' as metric,
  COUNT(DISTINCT po.user_id) as count
FROM payment_orders po
WHERE po.status = 'completed' AND po.plan_id IS NOT NULL
UNION ALL
SELECT 
  'Token Users',
  COUNT(DISTINCT po.user_id)
FROM payment_orders po
WHERE po.status = 'completed' AND po.tokens_to_add IS NOT NULL
UNION ALL
SELECT 
  'Total Paying Users',
  COUNT(DISTINCT po.user_id)
FROM payment_orders po
WHERE po.status = 'completed';

-- Result 2: Detailed breakdown
SELECT 
  au.email as user_email,
  mp.name as plan_name,
  po.amount,
  po.order_id,
  po.created_at,
  CASE WHEN po.tokens_to_add IS NOT NULL THEN po.tokens_to_add ELSE 0 END as tokens,
  po.status
FROM payment_orders po
LEFT JOIN auth.users au ON po.user_id = au.id
LEFT JOIN membership_plans mp ON po.plan_id = mp.id
WHERE po.order_id IN (
  '1759658697', '1759657681', '1759376885',
  '1759376875', '1759376049', '1759376024'
)
ORDER BY po.created_at DESC;

-- Result 3: Summary stats
SELECT 
  COUNT(*) as total_payments,
  COUNT(DISTINCT user_id) as membership_users,
  SUM(amount) as total_revenue,
  SUM(CASE WHEN plan_id IS NOT NULL THEN 1 ELSE 0 END) as membership_payments,
  SUM(CASE WHEN tokens_to_add IS NOT NULL THEN 1 ELSE 0 END) as token_payments,
  SUM(COALESCE(tokens_to_add, 0)) as total_tokens_sold
FROM payment_orders
WHERE status = 'completed';
