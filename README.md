# Clothify - Thử đồ thông minh với AI

Website thử đồ sử dụng AI để tạo ra kết quả thử đồ hoàn hảo. Được xây dựng với Next.js, TailwindCSS và tích hợp KIE.AI.

## ✨ Tính năng

- 🔐 **Đăng nhập Google OAuth** - Đăng nhập dễ dàng và bảo mật
- 📸 **Upload & Chụp ảnh** - Upload từ máy hoặc chụp trực tiếp qua webcam
- 🤖 **AI Thử đồ** - Tích hợp KIE.AI để tạo kết quả thử đồ chân thực
- 📱 **Responsive Design** - Giao diện đẹp trên mọi thiết bị
- 💾 **Lưu lịch sử** - Xem và quản lý tất cả ảnh đã thử
- ⚡ **Tối ưu hiệu suất** - Load nhanh với Next.js và TailwindCSS

## 🚀 Công nghệ sử dụng

### Frontend
- **Next.js 15** - React framework với App Router
- **TailwindCSS** - Utility-first CSS framework
- **TypeScript** - Type safety
- **Lucide React** - Icon library đẹp và tối giản

### Backend & Services
- **NextAuth.js** - Authentication với Google Provider
- **Supabase** - Database và Storage
- **KIE.AI** - AI model cho thử đồ

### UI/UX
- **Creative Minimalism** design style
- **Card stacking** layout với hiệu ứng động
- **Responsive** trên mọi thiết bị

## 📦 Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd clothify
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình Environment Variables
Tạo file `.env.local` và thêm các biến môi trường:

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# KIE.AI
KIEAI_API_KEY=your-kieai-api-key
```

### 4. Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

## 🔧 Cấu hình Services

### Google OAuth Setup
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Bật Google+ API
4. Tạo OAuth 2.0 credentials
5. Thêm authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### Supabase Setup
1. Truy cập [Supabase](https://supabase.com/)
2. Tạo project mới
3. Lấy URL và API keys từ Settings > API
4. Tạo tables cho users và images (xem schema bên dưới)

### KIE.AI Setup
1. Đăng ký tài khoản tại [KIE.AI](https://kie.ai/)
2. Lấy API key từ dashboard
3. Cấu hình model "nano banana" cho thử đồ

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Images Table
```sql
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  person_image_url TEXT NOT NULL,
  clothing_image_url TEXT NOT NULL,
  result_image_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📁 Cấu trúc Project

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth routes
│   │   └── clothify/      # Try-on API
│   ├── profile/           # Profile page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── AuthProvider.tsx   # NextAuth provider
│   ├── Header.tsx         # Navigation header
│   ├── UploadCard.tsx    # Image upload component
│   ├── TryOnButton.tsx   # Try-on action button
│   └── RecentImages.tsx  # Recent images display
└── lib/                   # Utilities
    ├── auth.ts           # NextAuth config
    ├── supabase.ts       # Supabase client
    └── kieai.ts          # KIE.AI integration
```

## 🎨 Design System

### Colors
- **Primary**: `#8d6aff` (Purple)
- **Accent**: `#f47560` (Orange)
- **Gray Scale**: `#f9fafb` to `#111827`

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Components
- **Cards**: Rounded corners, subtle shadows, hover effects
- **Buttons**: Primary/Secondary variants với smooth transitions
- **Inputs**: Focus states với ring effects

## 🚀 Deployment

### Vercel (Recommended)
1. Push code lên GitHub
2. Connect repository với Vercel
3. Thêm environment variables
4. Deploy tự động

### Manual Deployment
```bash
npm run build
npm start
```

## 🔮 Roadmap

### Phase 1 (MVP) ✅
- [x] Basic UI/UX
- [x] Google OAuth
- [x] Image upload & capture
- [x] KIE.AI integration
- [x] Image history

### Phase 2 (Enhancement)
- [ ] Outfit collections
- [ ] Social sharing
- [ ] Advanced AI models
- [ ] Mobile app

### Phase 3 (Scale)
- [ ] Multi-user features
- [ ] AI personalization
- [ ] E-commerce integration
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, hãy tạo issue trên GitHub hoặc liên hệ qua email.

---

**Clothify** - Thử đồ dễ dàng, sáng tạo nhưng tối giản ✨
