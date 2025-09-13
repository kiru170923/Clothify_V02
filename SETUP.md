# Hướng dẫn Setup Clothify

## 🚀 Bước 1: Chuẩn bị môi trường

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn
- Git

### Clone project
```bash
git clone <repository-url>
cd clothify
npm install
```

## 🔑 Bước 2: Cấu hình Google OAuth

### 1. Tạo Google Cloud Project
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" hoặc chọn project hiện có
3. Đặt tên project (ví dụ: "Clothify")

### 2. Bật Google+ API
1. Vào "APIs & Services" > "Library"
2. Tìm "Google+ API" và click "Enable"

### 3. Tạo OAuth 2.0 Credentials
1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Chọn "Web application"
4. Đặt tên (ví dụ: "Clothify Web Client")
5. Thêm Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 4. Lấy Client ID và Secret
- Copy Client ID và Client Secret
- Lưu vào file `.env.local`

## 🗄️ Bước 3: Setup Supabase

### 1. Tạo Supabase Project
1. Truy cập [Supabase](https://supabase.com/)
2. Click "New Project"
3. Chọn organization và đặt tên project
4. Chọn region gần nhất
5. Đặt password cho database

### 2. Lấy API Keys
1. Vào Settings > API
2. Copy các keys:
   - Project URL
   - anon public key
   - service_role key (secret)

### 3. Tạo Database Schema
1. Vào SQL Editor trong Supabase dashboard
2. Copy nội dung file `database/schema.sql`
3. Paste và chạy script

### 4. Cấu hình Storage
Storage buckets sẽ được tạo tự động từ schema.sql:
- `person-images` - Ảnh người dùng
- `clothing-images` - Ảnh quần áo  
- `result-images` - Ảnh kết quả

## 🤖 Bước 4: Setup KIE.AI

### 1. Đăng ký tài khoản
1. Truy cập [KIE.AI](https://kie.ai/)
2. Đăng ký tài khoản mới
3. Xác thực email

### 2. Lấy API Key
1. Vào Dashboard
2. Tìm phần API Keys
3. Tạo key mới hoặc copy key hiện có

### 3. Cấu hình Model
- Sử dụng model "nano banana" cho thử đồ
- Kiểm tra pricing và limits

## ⚙️ Bước 5: Cấu hình Environment Variables

Tạo file `.env.local` trong root directory:

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# Google OAuth (từ Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase (từ Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# KIE.AI (từ KIE.AI Dashboard)
KIEAI_API_KEY=your-kieai-api-key
```

### Tạo NEXTAUTH_SECRET
```bash
# Chạy lệnh này để tạo secret key
openssl rand -base64 32
```

## 🧪 Bước 6: Test và Chạy

### 1. Chạy development server
```bash
npm run dev
```

### 2. Kiểm tra các chức năng
1. Mở http://localhost:3000
2. Test đăng nhập Google
3. Test upload ảnh
4. Test chụp ảnh qua webcam
5. Test API thử đồ (sẽ trả về mock data)

### 3. Kiểm tra Database
1. Vào Supabase Dashboard > Table Editor
2. Kiểm tra tables `users` và `images`
3. Xem dữ liệu được tạo khi test

## 🚀 Bước 7: Deploy Production

### Option 1: Vercel (Recommended)
1. Push code lên GitHub
2. Truy cập [Vercel](https://vercel.com/)
3. Import project từ GitHub
4. Thêm environment variables
5. Deploy

### Option 2: Manual Deploy
```bash
npm run build
npm start
```

## 🔧 Troubleshooting

### Lỗi Google OAuth
- Kiểm tra redirect URI có đúng không
- Đảm bảo Google+ API đã được enable
- Kiểm tra Client ID và Secret

### Lỗi Supabase
- Kiểm tra URL và keys có đúng không
- Đảm bảo RLS policies đã được setup
- Kiểm tra storage buckets

### Lỗi KIE.AI
- Kiểm tra API key có hợp lệ không
- Kiểm tra account có đủ credits không
- Kiểm tra model name có đúng không

### Lỗi NextAuth
- Kiểm tra NEXTAUTH_SECRET có đủ dài không
- Kiểm tra NEXTAUTH_URL có đúng không
- Clear browser cookies và thử lại

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Kiểm tra Network tab trong DevTools
3. Kiểm tra Supabase logs
4. Tạo issue trên GitHub

---

**Chúc bạn setup thành công! 🎉**
