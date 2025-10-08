# Admin Dashboard Setup Guide

## Cấu hình Environment Variables

Để admin dashboard hoạt động, bạn cần tạo file `.env.local` với các biến môi trường sau:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# NextAuth Configuration  
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# KIE.AI
KIEAI_API_KEY=your-kieai-api-key

# PayOS
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key
```

## Cách lấy Supabase Keys

1. **NEXT_PUBLIC_SUPABASE_URL**: 
   - Vào Supabase Dashboard → Settings → API
   - Copy "Project URL"

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**:
   - Vào Supabase Dashboard → Settings → API  
   - Copy "anon public" key

3. **SUPABASE_SERVICE_ROLE_KEY**:
   - Vào Supabase Dashboard → Settings → API
   - Copy "service_role" key (⚠️ Bảo mật cao)

## Fallback Mode

Nếu không có `SUPABASE_SERVICE_ROLE_KEY`, hệ thống sẽ:
- Sử dụng `NEXT_PUBLIC_SUPABASE_ANON_KEY` làm fallback
- Hiển thị warning trong console
- Admin dashboard sẽ hoạt động với quyền hạn bị giới hạn

## Security Notes

- ⚠️ **KHÔNG** commit file `.env.local` vào git
- ⚠️ **KHÔNG** chia sẻ `SUPABASE_SERVICE_ROLE_KEY` 
- Chỉ sử dụng service role key trên server-side
- Anon key có thể sử dụng trên client-side

## Troubleshooting

### Lỗi "Missing SUPABASE_URL"
- Kiểm tra file `.env.local` có tồn tại
- Kiểm tra biến `NEXT_PUBLIC_SUPABASE_URL` có đúng format
- Restart development server sau khi thêm env vars

### Admin Dashboard không load dữ liệu
- Kiểm tra `SUPABASE_SERVICE_ROLE_KEY` có đúng
- Kiểm tra RLS policies trong Supabase
- Xem console logs để debug

### Permission denied errors
- Kiểm tra service role key có đủ quyền
- Kiểm tra RLS policies
- Thử disable RLS tạm thời để test

## Development vs Production

### Development
- Có thể sử dụng anon key làm fallback
- Mock data sẽ được hiển thị nếu không có service role key

### Production  
- **BẮT BUỘC** phải có `SUPABASE_SERVICE_ROLE_KEY`
- Không sử dụng fallback mode
- Cấu hình RLS policies đúng cách
