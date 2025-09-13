# 🚨 Fix Hoàn Chỉnh Token System

## ❌ Vấn đề hiện tại:
- Không có record token nào cho user
- Không thể đăng nhập với tài khoản mới
- Token system không hoạt động

## ⚡ Fix nhanh (Recommended):

### Bước 1: Chạy script hoàn chỉnh
Chạy script này trong Supabase SQL Editor:
```sql
-- complete-token-fix.sql
-- Script này sẽ:
-- 1. Disable RLS tạm thời
-- 2. Tạo tokens cho tất cả user hiện tại
-- 3. Tạo membership plans
-- 4. Hiển thị kết quả
```

### Bước 2: Test ngay
- Đăng nhập với tài khoản hiện tại
- Kiểm tra token count trên header
- Thử tạo 1 ảnh để test token deduction

## 🔧 Fix từng bước:

### 1. Kiểm tra hiện trạng:
```sql
-- Xem có bao nhiêu user và token
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM user_tokens;
```

### 2. Tạo tokens cho tất cả user:
```sql
-- create-tokens-for-all-users.sql
-- Tạo token records cho tất cả user chưa có
```

### 3. Fix RLS nếu cần:
```sql
-- disable-all-rls.sql
-- Disable RLS tạm thời để tránh lỗi permission
```

## ✅ Kết quả mong đợi:

### Trước khi fix:
- ❌ 0 token records
- ❌ Không thể đăng nhập tài khoản mới
- ❌ Token system không hoạt động

### Sau khi fix:
- ✅ Tất cả user có token records
- ✅ User cũ: 10 tokens miễn phí
- ✅ User mới: 5 tokens miễn phí
- ✅ Token count hiển thị trên header
- ✅ Có thể tạo ảnh và trừ token

## 📊 Kiểm tra kết quả:

### 1. Kiểm tra token distribution:
```sql
SELECT 
  total_tokens,
  COUNT(*) as user_count
FROM user_tokens
GROUP BY total_tokens;
```

### 2. Kiểm tra sample data:
```sql
SELECT 
  u.email,
  ut.total_tokens,
  ut.used_tokens,
  ut.total_tokens - ut.used_tokens as available_tokens
FROM users u
JOIN user_tokens ut ON u.id = ut.user_id
LIMIT 5;
```

## 🚀 Sau khi fix xong:

### 1. Test đăng nhập:
- Đăng nhập với tài khoản hiện tại
- Kiểm tra token count trên header

### 2. Test tạo ảnh:
- Upload ảnh người và quần áo
- Click "Tạo ảnh" để test token deduction

### 3. Test tài khoản mới:
- Thử đăng nhập với tài khoản Google mới
- Kiểm tra xem có được tạo token không

## 📝 Notes:
- RLS disable vẫn an toàn vì có authentication check ở API level
- Script tạo tokens cho tất cả user hiện tại
- User cũ (>30 ngày) được 10 tokens, user mới được 5 tokens
- Sau khi fix xong, có thể enable RLS lại nếu cần
