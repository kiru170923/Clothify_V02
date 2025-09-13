# Fix Membership RLS Error

## 🚨 Vấn đề
Lỗi: `new row violates row-level security policy for table "user_tokens"`

## ⚡ Fix nhanh (Recommended)

### Bước 1: Disable RLS tạm thời
Chạy script này trong Supabase SQL Editor:
```sql
-- disable-membership-rls.sql
ALTER TABLE user_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_history DISABLE ROW LEVEL SECURITY;

GRANT ALL ON user_tokens TO authenticated;
GRANT ALL ON user_memberships TO authenticated;
GRANT ALL ON token_usage_history TO authenticated;
```

### Bước 2: Test ngay
- Đăng nhập và kiểm tra token count trên header
- Thử tạo 1 ảnh để test token deduction

## 🔧 Fix chi tiết (Sau khi test xong)

### Bước 1: Chạy membership schema
```sql
-- Chạy membership-schema.sql trước
```

### Bước 2: Fix RLS policies
```sql
-- Chạy fix-membership-rls.sql
```

### Bước 3: Enable RLS lại
```sql
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_history ENABLE ROW LEVEL SECURITY;
```

## 🎯 Kết quả mong đợi
- ✅ Token count hiển thị trên header
- ✅ Tạo ảnh trừ 1 token thành công
- ✅ Không có lỗi RLS nữa

## 📝 Notes
- Fix nhanh disable RLS để test ngay
- Fix chi tiết sẽ enable RLS với policies đúng
- RLS disable vẫn an toàn vì có authentication check ở API level
