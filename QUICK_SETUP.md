# 🚀 Quick Setup để tạo 83 Users

## Lấy Supabase Service Role Key:

1. Vào: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy **service_role** key (key dài, không phải anon key)

## Tạo file .env.local:

Tạo file `.env.local` trong project root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDU5NzI0MDAsImV4cCI6MTk2MTU0ODQwMH0.your-actual-key-here
```

## Chạy script:

```bash
npx tsx scripts/create-83-fake-users.ts
```

## Kết quả mong đợi:

```
🚀 Starting to create 83 fake users...

✅ [1/83] Created nguyen.van.a@gmail.com (Nguyễn Văn A)
✅ [2/83] Created tran.thi.b@gmail.com (Trần Thị B)
...

📊 Summary:
   ✅ Created: 83
   ⏭️  Skipped: 0
   ❌ Errors: 0
   📝 Total: 83/83

📈 Current total users in user_profiles: 83
📈 Current total users in auth.users: 83

🎉 Script completed!
```

