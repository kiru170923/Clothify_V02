-- ============================================
-- CREATE REAL MEMBERSHIP USERS LINKED TO PAYMENTS
-- ============================================

-- Step 1: Create 6 fake users in auth.users table
-- NOTE: This requires using Supabase API or manually creating users
-- For now, we'll use the existing users or show the INSERT approach

-- If you want to INSERT directly (use Supabase SQL Editor):
-- Option A: Use existing users from auth.users
-- Option B: Create new users via Supabase Dashboard

-- Step 2: Link payments to specific users (Recommended approach)
-- Update the 6 payments to use real user IDs

-- First, get the existing users
SELECT id, email FROM auth.users LIMIT 10;

-- ============================================
-- Approach: Assign payments to real users
-- ============================================

-- Get list of all users
-- Then run UPDATE to assign payments to them

-- Example: If you have users, run this:
/*
UPDATE payment_orders 
SET user_id = (SELECT id FROM auth.users WHERE email LIKE '%@example.com' LIMIT 1)
WHERE order_id = '1759658697';

UPDATE payment_orders 
SET user_id = (SELECT id FROM auth.users WHERE email LIKE '%@example.com' OFFSET 1 LIMIT 1)
WHERE order_id = '1759657681';

... repeat for other 4 orders
*/

-- Step 3: Verify membership users count
SELECT 
  COUNT(DISTINCT po.user_id) as membership_users,
  COUNT(po.id) as total_payments,
  SUM(CASE WHEN po.plan_id IS NOT NULL THEN 1 ELSE 0 END) as membership_payments,
  SUM(CASE WHEN po.tokens_to_add IS NOT NULL THEN 1 ELSE 0 END) as token_payments
FROM payment_orders po
WHERE po.status = 'completed';

-- Step 4: Show detailed breakdown
SELECT 
  au.id,
  au.email,
  mp.name as plan_name,
  po.amount,
  po.order_id,
  po.created_at,
  CASE WHEN po.tokens_to_add IS NOT NULL THEN po.tokens_to_add ELSE 0 END as tokens
FROM payment_orders po
LEFT JOIN auth.users au ON po.user_id = au.id
LEFT JOIN membership_plans mp ON po.plan_id = mp.id
WHERE po.status = 'completed'
ORDER BY po.created_at DESC;
