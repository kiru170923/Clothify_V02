# 📧 Email Setup Guide - QR Feature Announcement

## 🚀 Quick Setup (5 phút)

### Bước 1: Tạo tài khoản Resend (Miễn phí)

1. Vào: https://resend.com/signup
2. Đăng ký với email của bạn
3. Verify email

### Bước 2: Lấy API Key

1. Vào Dashboard: https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name: `Clothify Production`
4. Permission: **Full Access**
5. Click **Create**
6. **Copy API key** (chỉ hiển thị 1 lần!)

### Bước 3: Setup Domain (Tùy chọn - cho production)

**Option A: Dùng domain test (ngay lập tức)**
- Resend cho phép gửi từ `onboarding@resend.dev`
- Giới hạn: 100 emails/day
- Dùng được ngay, không cần verify

**Option B: Dùng domain riêng (recommended cho production)**
1. Vào: https://resend.com/domains
2. Add domain: `clothify.top`
3. Add DNS records (SPF, DKIM) vào domain provider
4. Verify domain
5. Sau khi verify, emails sẽ gửi từ `noreply@clothify.top`

### Bước 4: Add API Key vào Vercel

**Local Development:**
Tạo file `.env.local` (nếu chưa có):
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Production (Vercel):**
1. Vào Vercel Dashboard → Settings → Environment Variables
2. Add new:
   - Name: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxx` (paste API key)
   - Environment: Production + Preview
3. Click Save
4. Re-deploy

---

## ✅ Test Email (Trước khi gửi cho tất cả users)

### Test với 5 users đầu tiên

**Method 1: Via API (Postman/Thunder Client)**

```bash
POST https://www.clothify.top/api/admin/send-qr-announcement?test=true
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Method 2: Via cURL**

```bash
curl -X POST "https://www.clothify.top/api/admin/send-qr-announcement?test=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Emails sent successfully (TEST MODE)",
  "stats": {
    "totalUsers": 5,
    "successCount": 5,
    "failedCount": 0,
    "testMode": true
  },
  "results": [...]
}
```

---

## 🚀 Gửi Email Cho Tất Cả Users

**⚠️ QUAN TRỌNG: Chạy test mode trước!**

### Gửi production

**Via API:**
```bash
POST https://www.clothify.top/api/admin/send-qr-announcement
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Via cURL:**
```bash
curl -X POST "https://www.clothify.top/api/admin/send-qr-announcement" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Thời gian ước tính

- **Rate limit**: 1 email/giây (để tránh spam)
- **100 users**: ~2 phút
- **500 users**: ~8 phút
- **1000 users**: ~17 phút

---

## 📊 Monitoring

### Check email status trong Resend Dashboard

1. Vào: https://resend.com/emails
2. Xem logs:
   - ✅ **Delivered**: Email gửi thành công
   - ⏳ **Queued**: Đang chờ gửi
   - ❌ **Bounced**: Email không tồn tại
   - ⚠️ **Complained**: User đánh dấu spam

### Troubleshooting

**Issue 1: API Key Invalid**
```
Error: Invalid API key
Solution: Check RESEND_API_KEY trong Vercel env vars
```

**Issue 2: Domain not verified**
```
Error: Domain not verified
Solution: 
1. Hoặc dùng onboarding@resend.dev (test domain)
2. Hoặc verify domain chính thức
```

**Issue 3: Rate limit exceeded**
```
Error: Too many requests
Solution: Đợi 1 phút hoặc upgrade Resend plan
```

---

## 💰 Resend Pricing

### Free Tier (đủ cho bắt đầu)
- ✅ 100 emails/day
- ✅ 3,000 emails/month
- ✅ 1 domain
- ✅ Email analytics

### Pro Plan ($20/month - nếu cần sau này)
- ✅ 50,000 emails/month
- ✅ Unlimited domains
- ✅ Priority support
- ✅ Advanced analytics

---

## 🎯 Best Practices

### 1. Test trước khi gửi production
```bash
# Luôn chạy test mode trước
?test=true
```

### 2. Gửi vào thời gian tối ưu
- **Best time**: 9AM - 11AM hoặc 2PM - 4PM (giờ Việt Nam)
- **Avoid**: Cuối tuần, sau 9PM

### 3. Monitor bounce rate
- **Good**: < 2% bounce
- **Bad**: > 5% bounce (có thể bị đánh dấu spam)

### 4. Personalize
- Email đã có {{USER_NAME}} và {{USER_EMAIL}}
- Tăng open rate

---

## 📝 Email Template Customization

Nếu muốn chỉnh sửa nội dung email:

**File locations:**
- HTML: `src/lib/email-templates/qr-feature-announcement.html`
- Text: `src/lib/email-templates/qr-feature-announcement.txt`

**Placeholders:**
- `{{USER_NAME}}`: Tên user
- `{{USER_EMAIL}}`: Email user

**Sau khi edit:**
1. Commit changes
2. Push lên git
3. Vercel auto-deploy
4. Test lại với `?test=true`

---

## 🔒 Security

**Admin-only endpoint:**
- Chỉ admin mới gọi được API
- Check `is_admin` trong `user_profiles`

**Email validation:**
- Tự động skip test/fake emails
- Skip emails không hợp lệ

**Rate limiting:**
- 1 email/giây để tránh spam
- Resend tự động throttle nếu quá nhanh

---

## ✨ Ready to Send!

**Checklist trước khi gửi:**

- [ ] RESEND_API_KEY đã set trong Vercel
- [ ] Test mode đã chạy thành công (`?test=true`)
- [ ] Kiểm tra email template trong inbox
- [ ] Verify domain (nếu dùng domain riêng)
- [ ] Chọn thời gian gửi tối ưu
- [ ] Admin token sẵn sàng

**Command cuối cùng:**
```bash
curl -X POST "https://www.clothify.top/api/admin/send-qr-announcement" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📞 Support

Nếu có vấn đề:
1. Check Resend Dashboard logs
2. Check Vercel deployment logs
3. Check API response trong browser DevTools

**Resend Docs**: https://resend.com/docs
**Resend Status**: https://status.resend.com

---

**Last Updated**: October 2025  
**Version**: 1.0.0

