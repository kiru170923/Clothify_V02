# 🔧 Khắc phục lỗi RLS trong Supabase

## ❌ Lỗi hiện tại:
```
Supabase upload error: new row violates row-level security policy
```

## 🔍 Nguyên nhân:
- Row Level Security (RLS) policies quá strict
- User chưa được tạo trong bảng `users` khi đăng nhập
- Storage policies chưa được cấu hình đúng

## ✅ Cách khắc phục:

### 1. Chạy SQL script trong Supabase:

1. **Vào Supabase Dashboard:**
   - Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
   - Chọn project của bạn
   - Vào **SQL Editor**

2. **Chạy script fix:**
   - Copy nội dung file `database/fix-rls.sql`
   - Paste vào SQL Editor
   - Click **Run** để thực thi

### 2. Kiểm tra kết quả:

Sau khi chạy script, bạn sẽ có:
- ✅ Function tự động tạo user khi đăng nhập
- ✅ RLS policies được cấu hình đúng
- ✅ Storage policies cho phép upload
- ✅ Permissions được grant đúng

### 3. Test lại:

1. **Đăng nhập lại** trên ứng dụng
2. **Thử upload ảnh** - không còn lỗi RLS
3. **Kiểm tra database** - user sẽ được tạo tự động

## 🔍 Kiểm tra trong Supabase:

### Users table:
```sql
SELECT * FROM users;
```

### Images table:
```sql
SELECT * FROM images;
```

### Storage buckets:
```sql
SELECT * FROM storage.buckets;
```

## ⚠️ Lưu ý:

- Script này sẽ **xóa và tạo lại** các policies
- **Không ảnh hưởng** đến dữ liệu hiện có
- **An toàn** để chạy trên production

## 🚀 Sau khi fix:

- Upload ảnh sẽ hoạt động bình thường
- User sẽ được tạo tự động khi đăng nhập
- RLS sẽ bảo vệ dữ liệu của từng user
