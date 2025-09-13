# Migration Guide for Existing Users

## Vấn đề
Các user đã tồn tại trước khi implement token system sẽ không có record trong bảng `user_tokens`, dẫn đến lỗi khi họ cố gắng sử dụng tính năng AI.

## Giải pháp

### Bước 1: Chạy Membership Schema
Trước tiên, chạy file `membership-schema.sql` trong Supabase SQL Editor để tạo các bảng cần thiết.

### Bước 2: Chạy Migration Script
Chạy file `migrate-existing-users.sql` trong Supabase SQL Editor để:

1. **Tạo token records cho tất cả user hiện tại**
   - User mới: 5 tokens miễn phí
   - User cũ (>30 ngày): 10 tokens miễn phí

2. **Verify migration thành công**
   - Kiểm tra số lượng user có/không có tokens
   - Hiển thị tổng số tokens đã phân phối

### Bước 3: Test Migration
Sau khi chạy migration:

1. **Kiểm tra trong Supabase Dashboard:**
   ```sql
   SELECT COUNT(*) FROM user_tokens;
   SELECT COUNT(*) FROM users;
   ```

2. **Test với user cũ:**
   - Đăng nhập với tài khoản cũ
   - Kiểm tra token count hiển thị trên header
   - Thử tạo 1 ảnh để test token deduction

### Bước 4: Monitor
Theo dõi logs để đảm bảo không có lỗi khi user cũ truy cập.

## API Auto-Creation
Ngoài ra, API đã được cập nhật để tự động tạo token record nếu chưa có khi user truy cập lần đầu sau khi deploy.

## Rollback Plan
Nếu cần rollback:
1. Backup bảng `user_tokens` trước khi chạy migration
2. Có thể xóa bảng `user_tokens` và tắt tính năng token tạm thời

## Notes
- Migration script an toàn, chỉ INSERT không UPDATE
- Không ảnh hưởng đến dữ liệu user hiện tại
- Tự động detect user cũ/mới dựa trên `created_at`
