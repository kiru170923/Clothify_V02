# 🔐 Hướng dẫn sửa lỗi Supabase Auth Redirect

## ❌ **Vấn đề hiện tại:**
Khi đăng nhập từ `https://clothify-v02.vercel.app`, bị redirect về `https://clothify.top` thay vì ở lại domain hiện tại.

## 🔍 **Nguyên nhân:**
- Supabase Auth sử dụng **Site URL** làm redirect mặc định
- Nếu không truyền `redirectTo` đúng cách, sẽ dùng Site URL thay vì domain hiện tại

## ✅ **Giải pháp đã áp dụng:**

### **1. Code đã được cải thiện:**
- ✅ **Auth Helper:** Tạo `src/lib/authHelpers.ts` để xử lý redirect thông minh
- ✅ **Dynamic Redirect:** Sử dụng `window.location.origin` để tự động detect domain
- ✅ **Environment Detection:** Tự động nhận biết môi trường (dev/preview/production)
- ✅ **Logging:** Thêm logging để debug redirect issues

### **2. Cấu hình Supabase Dashboard:**

#### **Site URL:**
```
https://clothify.top
```

#### **Redirect URLs (đã có):**
```
https://clothify-v02.vercel.app/auth/callback
https://clothify.top/auth/callback
http://localhost:3000/auth/callback
```

### **3. Cách hoạt động:**

#### **Development (localhost:3000):**
```javascript
// Tự động redirect về:
http://localhost:3000/auth/callback
```

#### **Preview (vercel.app):**
```javascript
// Tự động redirect về:
https://clothify-v02.vercel.app/auth/callback
```

#### **Production (clothify.top):**
```javascript
// Tự động redirect về:
https://clothify.top/auth/callback
```

## 🧪 **Test:**

### **1. Test trên Vercel:**
1. Truy cập `https://clothify-v02.vercel.app`
2. Click "Đăng nhập với Google"
3. Sau khi login, sẽ redirect về `https://clothify-v02.vercel.app/auth/callback`
4. Sau đó redirect về `https://clothify-v02.vercel.app` (không phải clothify.top)

### **2. Test trên Production:**
1. Truy cập `https://clothify.top`
2. Click "Đăng nhập với Google"
3. Sau khi login, sẽ redirect về `https://clothify.top/auth/callback`
4. Sau đó redirect về `https://clothify.top`

### **3. Test trên Local:**
1. Chạy `npm run dev`
2. Truy cập `http://localhost:3000`
3. Click "Đăng nhập với Google"
4. Sau khi login, sẽ redirect về `http://localhost:3000/auth/callback`
5. Sau đó redirect về `http://localhost:3000`

## 🔧 **Debug:**

### **Kiểm tra console log:**
Khi click đăng nhập, sẽ thấy log:
```
🔐 Auth Configuration: {
  origin: "https://clothify-v02.vercel.app",
  redirectUrl: "https://clothify-v02.vercel.app/auth/callback",
  environment: "Preview"
}
✅ Auth redirect initiated to: https://clothify-v02.vercel.app/auth/callback
```

### **Nếu vẫn lỗi:**
1. Kiểm tra **Redirect URLs** trong Supabase Dashboard
2. Kiểm tra console log để xem redirect URL có đúng không
3. Đảm bảo domain hiện tại có trong **Redirect URLs**

## 📝 **Lưu ý:**

- **Site URL** vẫn giữ là `https://clothify.top` (domain chính)
- **Redirect URLs** phải có tất cả domains bạn sử dụng
- Code sẽ tự động detect domain hiện tại và redirect đúng
- Không cần thay đổi gì trong Supabase Dashboard nếu đã cấu hình đúng

## 🚀 **Kết quả:**
- ✅ Đăng nhập từ Vercel → ở lại Vercel
- ✅ Đăng nhập từ Production → ở lại Production  
- ✅ Đăng nhập từ Local → ở lại Local
- ✅ Không bị redirect về domain sai nữa
