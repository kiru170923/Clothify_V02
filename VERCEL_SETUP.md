# 🚀 Hướng dẫn Deploy lên Vercel

## ⚠️ Lỗi thường gặp: Redirect về localhost:3000

### Nguyên nhân:
- Environment variables trên Vercel chưa được cấu hình đúng
- Google OAuth redirect URIs chưa có domain Vercel

## 🔧 Cách khắc phục:

### 1. Cấu hình Environment Variables trên Vercel

Vào **Vercel Dashboard** → **Project Settings** → **Environment Variables** và thêm:

```env
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
KIEAI_API_KEY=your-kieai-api-key
```

**⚠️ Quan trọng:** 
- Thay `your-app-name` bằng tên app thực tế trên Vercel
- `NEXTAUTH_URL` phải là domain Vercel, không phải localhost

### 2. Cấu hình Google OAuth redirect URIs

Vào **Google Cloud Console** → **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs** và thêm:

**Authorized redirect URIs:**
- `http://localhost:3000/api/auth/callback/google` (development)
- `https://your-app-name.vercel.app/api/auth/callback/google` (production)

### 3. Redeploy trên Vercel

Sau khi cấu hình xong:
1. Vào Vercel Dashboard
2. Click **Redeploy** để deploy lại với environment variables mới

## ✅ Kiểm tra:

1. Đăng nhập trên domain Vercel (không phải localhost)
2. Nếu vẫn redirect về localhost, kiểm tra lại `NEXTAUTH_URL`
3. Kiểm tra Google OAuth redirect URIs có đúng domain không

## 🔍 Troubleshooting:

### Lỗi "redirect_uri_mismatch"
- Kiểm tra Google OAuth redirect URIs có đúng domain Vercel không
- Đảm bảo không có dấu `/` thừa ở cuối URL

### Vẫn redirect về localhost
- Kiểm tra `NEXTAUTH_URL` trên Vercel có đúng không
- Redeploy lại project sau khi thay đổi environment variables

### Lỗi authentication
- Kiểm tra tất cả environment variables đã được set đúng
- Kiểm tra Google OAuth credentials có đúng không
