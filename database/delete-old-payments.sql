-- Delete all old payments, keep only the 6 new transactions

-- Disable RLS temporarily
ALTER TABLE payment_orders DISABLE ROW LEVEL SECURITY;

-- Delete all payments EXCEPT the 6 new ones
DELETE FROM payment_orders 
WHERE order_id NOT IN (
  '1759658697',  -- Medium tháng - 99,000
  '1759657681',  -- Token - 15,000
  '1759376885',  -- Standard tháng - 59,000
  '1759376875',  -- Standard tháng - 59,000
  '1759376049',  -- Standard tháng - 59,000
  '1759376024'   -- Premium tháng - 159,000
);

-- Re-enable RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Verify: show remaining transactions
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
ORDER BY po.created_at DESC;
