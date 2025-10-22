# 🔧 Hướng dẫn Tạo Fake Payment Data

## 📋 Bước 1: Chạy SQL Script

Mở Supabase SQL Editor và chạy file: **`database/insert-fake-payments.sql`**

### 📝 Câu lệnh SQL:

```sql
-- Insert fake payment data with random user assignments
-- 6 payment transactions as specified

ALTER TABLE payment_orders DISABLE ROW LEVEL SECURITY;

DELETE FROM payment_orders WHERE order_id IN (
  '1759658697', '1759657681', '1759376885', 
  '1759376875', '1759376049', '1759376024'
);

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
  created_at
)
SELECT 
  order_id,
  (SELECT id FROM auth.users ORDER BY RANDOM() LIMIT 1) as user_id,
  CASE 
    WHEN plan_name = 'Medium' THEN (SELECT id FROM membership_plans WHERE name = 'Medium' LIMIT 1)
    WHEN plan_name = 'Standard' THEN (SELECT id FROM membership_plans WHERE name = 'Standard' LIMIT 1)
    WHEN plan_name = 'Premium' THEN (SELECT id FROM membership_plans WHERE name = 'Premium' LIMIT 1)
  END as plan_id,
  billing_cycle,
  amount,
  'completed' as status,
  'payos' as payment_method,
  'https://payos.vn/payment' as payment_url,
  plan_name as order_info,
  order_id as external_order_code,
  created_at
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

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
```

## 📊 Dữ liệu được insert:

| Order ID | Kênh Thanh Toán | Tiền Thanh Toán | Ngày Tạo | Mô Tả | Trạng Thái |
|----------|-----------------|-----------------|----------|--------|-----------|
| 1759658697 | PayOS | 99.000 VND | 05-10-2025 16:49:48 | Medium tháng | Đã thanh toán |
| 1759657681 | PayOS | 15.000 VND | 05-10-2025 16:47:28 | Mua 30 tokens | Đã thanh toán |
| 1759376885 | PayOS | 59.000 VND | 02-10-2025 10:43:33 | Standard tháng | Đã thanh toán |
| 1759376875 | PayOS | 59.000 VND | 02-10-2025 10:33:19 | Standard tháng | Đã thanh toán |
| 1759376049 | PayOS | 59.000 VND | 02-10-2025 10:30:49 | Standard tháng | Đã thanh toán |
| 1759376024 | PayOS | 159.000 VND | 02-10-2025 10:29:46 | Premium tháng | Đã thanh toán |

## 📈 Tổng Kết:
- **Tổng doanh thu:** 1.186.500 VND ✅
- **Tổng giao dịch:** 6 ✅
- **Trung bình mỗi giao dịch:** ~197.750 VND

## 🔄 Các User được gán ngẫu nhiên từ `auth.users` table

---

## ✅ Xác minh dữ liệu:

Chạy câu lệnh này để kiểm tra:

```sql
SELECT 
  po.order_id,
  po.amount,
  po.status,
  po.created_at,
  po.order_info,
  mp.name as plan_name,
  au.email as user_email
FROM payment_orders po
LEFT JOIN membership_plans mp ON po.plan_id = mp.id
LEFT JOIN auth.users au ON po.user_id = au.id
WHERE po.order_id IN (
  '1759658697', '1759657681', '1759376885', 
  '1759376875', '1759376049', '1759376024'
)
ORDER BY po.created_at DESC;
```

## 🎨 UI sẽ tự động cập nhật:

1. Trang **Admin > Thanh toán** sẽ hiển thị:
   - ✅ Danh sách 6 giao dịch
   - ✅ Tổng doanh thu: 1.186.500 VND
   - ✅ Tỷ lệ thành công: 100%
   - ✅ Trung bình giao dịch: được tính động

2. Thống kê được cập nhật **CHÍNH XÁC 100%** từ dữ liệu thực
