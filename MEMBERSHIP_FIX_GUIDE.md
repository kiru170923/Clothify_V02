# Hướng dẫn sửa lỗi Membership

## Vấn đề
Lỗi: `Could not find a relationship between 'user_memberships' and 'membership_plans' in the schema cache`

## Nguyên nhân
Bảng `membership_plans` chưa được tạo trong Supabase database hoặc thiếu foreign key relationship.

## Cách sửa

### Cách 1: Script hoàn chỉnh (Khuyến nghị)
1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Copy và paste nội dung từ file `database/complete-membership-fix.sql`
4. Chạy script (sẽ xử lý tất cả các bước, bao gồm cả fix foreign key cho `payment_orders`)

### Cách 2: Từng bước
1. **Tạo bảng membership_plans**: Copy và chạy `database/simple-membership-plans.sql`
2. **Sửa foreign key**: Copy và chạy `database/fix-foreign-key-relationship.sql`

### Bước 3: Kiểm tra
1. Restart ứng dụng
2. Đăng nhập và kiểm tra trang Profile
3. Membership plan sẽ hiển thị đúng thay vì "Free"

## Files cần chạy trong Supabase SQL Editor:
- `database/complete-membership-fix.sql` - **Script hoàn chỉnh** (khuyến nghị)
- `database/simple-membership-plans.sql` - Tạo bảng membership_plans (script đơn giản)
- `database/fix-foreign-key-relationship.sql` - Sửa foreign key relationship

## Kết quả mong đợi:
- Membership plan hiển thị đúng (Standard, Medium, Premium)
- Số tokens hiển thị chính xác
- Không còn lỗi foreign key relationship
