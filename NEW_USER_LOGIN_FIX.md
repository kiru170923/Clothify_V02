# 🚨 Fix New User Login Issue

## ❌ Vấn đề:
Không thể đăng nhập với tài khoản Google mới. Lỗi: `Database error saving new user`

## 🔍 Nguyên nhân:
1. **Trigger tạo user mới bị lỗi**
2. **RLS policies quá strict**
3. **Function handle_new_user() không hoạt động đúng**

## ⚡ Fix nhanh (Recommended):

### Bước 1: Disable RLS tạm thời
Chạy script này trong Supabase SQL Editor:
```sql
-- disable-all-rls.sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens DISABLE ROW LEVEL SECURITY;
-- ... (xem file disable-all-rls.sql)
```

### Bước 2: Fix user creation trigger
Chạy script này trong Supabase SQL Editor:
```sql
-- fix-new-user-creation.sql
-- Tạo lại function và trigger với error handling tốt hơn
```

### Bước 3: Test ngay
- Thử đăng nhập với tài khoản Google mới
- Kiểm tra xem user có được tạo trong bảng `users` không
- Kiểm tra token có được tạo trong bảng `user_tokens` không

## 🔧 Fix chi tiết:

### 1. Kiểm tra trigger hiện tại:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

### 2. Xem logs lỗi:
- Vào Supabase Dashboard → Logs
- Tìm lỗi liên quan đến `handle_new_user`

### 3. Test function thủ công:
```sql
-- Test function với dummy data
SELECT public.handle_new_user();
```

## ✅ Kết quả mong đợi:
- ✅ Tài khoản Google mới đăng nhập thành công
- ✅ User record được tạo trong bảng `users`
- ✅ Token record được tạo trong bảng `user_tokens`
- ✅ Không có lỗi database

## 📝 Notes:
- RLS disable vẫn an toàn vì có authentication check ở API level
- Sau khi fix xong, có thể enable RLS lại với policies đúng
- Function mới có error handling tốt hơn và không fail auth process
