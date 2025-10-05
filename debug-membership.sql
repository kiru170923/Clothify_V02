-- Debug script để kiểm tra membership system
-- Chạy trong Supabase SQL Editor

-- 1. Kiểm tra bảng user_memberships có tồn tại không
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_memberships'
) as user_memberships_exists;

-- 2. Kiểm tra structure của bảng user_memberships
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_memberships' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Kiểm tra có record nào trong user_memberships không
SELECT COUNT(*) as total_memberships FROM user_memberships;

-- 4. Xem tất cả user_memberships với plan details
SELECT 
    um.id,
    um.user_id,
    um.plan_id,
    um.status,
    um.start_date,
    um.end_date,
    um.billing_cycle,
    mp.name as plan_name,
    mp.tokens_monthly,
    mp.tokens_yearly
FROM user_memberships um
LEFT JOIN membership_plans mp ON um.plan_id = mp.id
ORDER BY um.created_at DESC
LIMIT 10;

-- 5. Kiểm tra payment_orders gần đây
SELECT 
    po.id,
    po.user_id,
    po.plan_id,
    po.status,
    po.billing_cycle,
    po.amount,
    po.created_at,
    mp.name as plan_name
FROM payment_orders po
LEFT JOIN membership_plans mp ON po.plan_id = mp.id
WHERE po.status = 'completed'
ORDER BY po.created_at DESC
LIMIT 5;

-- 6. Kiểm tra user có membership active không (thay YOUR_USER_ID bằng user ID thực)
-- SELECT 
--     um.*,
--     mp.name as plan_name
-- FROM user_memberships um
-- JOIN membership_plans mp ON um.plan_id = mp.id
-- WHERE um.user_id = 'YOUR_USER_ID'
-- AND um.status = 'active'
-- ORDER BY um.created_at DESC;

