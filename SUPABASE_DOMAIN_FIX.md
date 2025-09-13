# 🔐 Fix Domain Authentication Issue

## 🚨 Vấn đề hiện tại:
Không thể đăng nhập trên `https://www.clothify.top/` (có www), chỉ đăng nhập được trên localhost.

## 🔍 Nguyên nhân:
1. **Domain normalization**: Code đang loại bỏ `www.` khỏi URL
2. **Supabase Auth settings**: Thiếu domain `www.clothify.top` trong redirect URLs
3. **Google OAuth**: Thiếu domain `www.clothify.top` trong authorized redirect URIs

## ✅ Giải pháp đã áp dụng:

### 1. Code đã được fix:
- ✅ **authHelpers.ts**: Xử lý đặc biệt cho `www.clothify.top` → chuyển về `clothify.top`
- ✅ **Domain normalization**: Giữ nguyên logic nhưng handle riêng cho clothify.top
- ✅ **Allowed domains**: Cập nhật danh sách domains được phép

### 2. Cần cập nhật Supabase Dashboard:

#### **Site URL (giữ nguyên):**
```
https://clothify.top
```

#### **Redirect URLs (cần thêm):**
```
https://clothify.top/auth/callback
https://www.clothify.top/auth/callback  ← THÊM DÒNG NÀY
https://clothify-v02.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

### 3. Cần cập nhật Google OAuth:

#### **Authorized redirect URIs (cần thêm):**
```
http://localhost:3000/api/auth/callback/google
https://clothify.top/api/auth/callback/google
https://www.clothify.top/api/auth/callback/google  ← THÊM DÒNG NÀY
https://clothify-v02.vercel.app/api/auth/callback/google
```

## 🧪 Test sau khi fix:

### 1. Test trên www.clothify.top:
1. Truy cập `https://www.clothify.top/`
2. Click "Đăng nhập với Google"
3. Sau khi login, sẽ redirect về `https://clothify.top/auth/callback`
4. Sau đó redirect về `https://clothify.top` (không có www)

### 2. Test trên clothify.top:
1. Truy cập `https://clothify.top/`
2. Click "Đăng nhập với Google"
3. Sau khi login, sẽ redirect về `https://clothify.top/auth/callback`
4. Sau đó redirect về `https://clothify.top`

## 📝 Logic hoạt động:
- User truy cập `www.clothify.top` → Code tự động chuyển về `clothify.top`
- Tất cả redirects đều về `clothify.top` (không có www)
- Consistent domain experience cho user

## ⚠️ Lưu ý:
- Cần cập nhật Supabase Dashboard và Google OAuth settings
- Deploy code mới lên production
- Test kỹ trên cả 2 domain: `clothify.top` và `www.clothify.top`
