# 🎯 Hướng dẫn tạo 83 Fake Users

Bạn có **2 cách** để tạo 83 fake users trong database:

## Cách 1: Sử dụng Node.js Script (Khuyên dùng) ⭐

Script này sử dụng Supabase Admin API để tạo users một cách an toàn và đầy đủ.

### Bước 1: Cài đặt dependencies
```bash
npm install dotenv
```

### Bước 2: Chạy script
```bash
npx tsx scripts/create-83-fake-users.ts
```

### Script sẽ:
- ✅ Tạo users trong `auth.users` (Supabase Auth)
- ✅ Tự động sync vào `public.users` (via trigger)
- ✅ Tạo entries trong `public.user_profiles` (cho stats)
- ✅ Tạo entries trong `public.user_tokens` (5 tokens mỗi user)
- ✅ Skip users đã tồn tại
- ✅ Hiển thị progress và summary

### Output mẫu:
```
🚀 Starting to create 83 fake users...

✅ [1/83] Created user1@clothify.com (Nguyễn Văn A)
✅ [2/83] Created user2@clothify.com (Trần Thị B)
...
⏭️  [15/83] Skipping user15@clothify.com - already exists

📊 Summary:
   ✅ Created: 80
   ⏭️  Skipped: 3
   ❌ Errors: 0
   📝 Total: 83/83

📈 Current total users in user_profiles: 83
📈 Current total users in auth.users: 83

🎉 Script completed!
```

---

## Cách 2: Sử dụng SQL Script

Nếu bạn muốn chạy trực tiếp trong Supabase SQL Editor:

### Bước 1: Mở Supabase Dashboard
1. Vào https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor**

### Bước 2: Chạy script
Copy và paste nội dung file `database/create-83-users-complete.sql` vào SQL Editor và Run.

### Script SQL sẽ:
- ✅ Tạo function để insert users vào cả `auth.users` và `public.users`
- ✅ Tạo user_profiles với random data
- ✅ Tạo user_tokens với 5 tokens
- ✅ Disable triggers tạm thời để tránh conflict
- ✅ Verify counts cuối cùng

---

## Cấu trúc Users được tạo

Mỗi user sẽ có:

### 1. Auth User (`auth.users`)
- Email: `userX@clothify.com` (X từ 1-83)
- Password: `TempPassword123!`
- Email confirmed: ✅
- Name trong metadata

### 2. Public User (`public.users`)
- Sync tự động từ auth.users
- Provider: google
- Provider ID: google_X

### 3. User Profile (`public.user_profiles`)
- Gender: random (male/female)
- Age group: random (18-25, 26-35, 36-45, 46+)
- Height: random (150-190cm)
- Weight: random (50-90kg)
- Size: random (S, M, L, XL)
- Style preferences: casual, formal, sporty
- Favorite colors: blue, black, white

### 4. User Tokens (`public.user_tokens`)
- Total tokens: 5
- Used tokens: 0
- Last reset: NOW()

---

## Kiểm tra sau khi tạo

### Kiểm tra số lượng users:
```sql
SELECT 
  'auth.users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'public.users', COUNT(*) FROM public.users
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM public.user_profiles
UNION ALL
SELECT 'user_tokens', COUNT(*) FROM public.user_tokens;
```

### Xem sample users:
```sql
SELECT 
  u.email,
  u.name,
  up.gender,
  up.age_group,
  ut.total_tokens
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.user_tokens ut ON u.id = ut.user_id
ORDER BY u.created_at DESC
LIMIT 10;
```

### Kiểm tra trong Admin Dashboard:
API endpoint: `/api/admin/stats` sẽ hiển thị:
```json
{
  "users": {
    "total": 83,
    "active": ...,
    "premium": ...,
    "growthRate": ...
  }
}
```

---

## Troubleshooting

### Nếu gặp lỗi "Missing SUPABASE_SERVICE_ROLE_KEY":
1. Tạo file `.env.local` trong project root
2. Thêm:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Nếu users không sync vào public.users:
- Kiểm tra trigger `on_auth_user_created` có tồn tại không
- Chạy lại `database/fix-new-user-creation.sql`

### Nếu user_profiles không được tạo:
- Script sẽ tự động handle nhưng có thể có warning
- Bạn có thể insert manually:
```sql
INSERT INTO public.user_profiles (user_id, gender, age_group, height_cm, weight_kg, size)
SELECT id, 'male', '18-25', 170, 70, 'M'
FROM public.users 
WHERE id NOT IN (SELECT user_id FROM public.user_profiles);
```

---

## Xóa users (nếu cần)

```sql
-- Xóa tất cả fake users
DELETE FROM auth.users WHERE email LIKE 'user%@clothify.com';

-- Hoặc xóa theo số lượng
DELETE FROM auth.users WHERE email LIKE 'user%@clothify.com' LIMIT 10;
```

⚠️ **Lưu ý**: Cascade sẽ tự động xóa trong public.users, user_profiles, user_tokens

---

## Kết quả mong đợi

Sau khi chạy script thành công:
- ✅ `auth.users`: 83 users
- ✅ `public.users`: 83 users  
- ✅ `public.user_profiles`: 83 profiles
- ✅ `public.user_tokens`: 83 token records
- ✅ Admin dashboard hiển thị: "Total Users: 83"

🎉 **Done!**

