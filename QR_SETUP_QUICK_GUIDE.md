# 🚀 QR Codes Feature - Quick Setup Guide

## Step-by-Step Setup (5 phút)

### 1️⃣ Database Setup

**Vào Supabase Dashboard → SQL Editor:**

```bash
Copy toàn bộ nội dung file: database/qr-codes-schema.sql
Paste vào SQL Editor
Click "Run"
```

✅ Tạo được:
- `qr_codes` table
- `qr_scan_history` table  
- RLS policies
- Helper functions

### 2️⃣ Install Dependencies (Đã done!)

```bash
npm install qrcode qrcode.react @types/qrcode
```

### 3️⃣ Test Database

**Verify tables exist:**

Chạy trong Supabase SQL Editor:
```sql
SELECT * FROM qr_codes LIMIT 1;
SELECT * FROM qr_scan_history LIMIT 1;
SELECT generate_unique_qr_code(); -- Should return random 8-char code
```

### 4️⃣ Test API Endpoints

**Start dev server:**
```bash
npm run dev
```

**Test in browser/Postman:**

1. **Generate QR** (cần auth):
```
POST http://localhost:3000/api/qr/generate
Headers: Authorization: Bearer {your_token}
Body: {
  "clothingImageUrl": "https://example.com/image.jpg",
  "name": "Test QR"
}
```

2. **List QRs** (cần auth):
```
GET http://localhost:3000/api/qr/list
Headers: Authorization: Bearer {your_token}
```

3. **Get QR Info** (public - không cần auth):
```
GET http://localhost:3000/api/qr/{code}/info
```

### 5️⃣ Test UI

**Navigation:**
1. Login vào Clothify
2. Click **"QR Codes"** trong sidebar
3. Click **"Tạo QR mới"**
4. Upload ảnh sản phẩm
5. Click **"Tạo QR Code"**

**Expected Result:**
- QR được tạo thành công
- Hiển thị trong dashboard
- Có thể download 3 formats
- Có QR preview

### 6️⃣ Test Public Page

**Flow:**
1. Copy public URL từ QR detail: `http://localhost:3000/try/{code}`
2. Mở trong tab mới (hoặc điện thoại)
3. Upload ảnh người
4. Click "Thử ngay!"
5. Đợi kết quả (~15-30s)
6. Download result

---

## Quick Tests

### Test Checklist

**Database:**
- [ ] Tables created successfully
- [ ] RLS policies working
- [ ] Functions executable

**APIs:**
- [ ] Generate QR works
- [ ] List QRs works
- [ ] Get QR info works (public)
- [ ] Try-on works (public)
- [ ] Status update works
- [ ] Delete works

**UI:**
- [ ] QR dashboard loads
- [ ] Create QR page works
- [ ] Upload image works
- [ ] QR preview shows
- [ ] Export options work (3 formats)
- [ ] Public page loads
- [ ] Try-on completes
- [ ] Result displays

**Token System:**
- [ ] Token deducted on successful try-on
- [ ] Insufficient tokens handled
- [ ] Token balance updates

**Security:**
- [ ] Rate limiting works
- [ ] Expired QRs blocked
- [ ] Disabled QRs blocked
- [ ] Max uses enforced

---

## Common Issues

### Issue 1: Function not found

**Error**: `function generate_unique_qr_code does not exist`

**Solution**: 
```sql
-- Run this in Supabase SQL Editor:
CREATE OR REPLACE FUNCTION generate_unique_qr_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    SELECT EXISTS(SELECT 1 FROM qr_codes WHERE code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Issue 2: RLS blocking queries

**Error**: `new row violates row-level security policy`

**Solution**:
```sql
-- Check policies exist:
SELECT * FROM pg_policies WHERE tablename = 'qr_codes';

-- If missing, re-run the schema file
```

### Issue 3: Storage upload fails

**Error**: `Failed to upload image`

**Solution**:
1. Verify `images` bucket exists in Supabase Storage
2. Check bucket is public
3. Verify storage policies allow uploads

```sql
-- Storage policy for authenticated uploads:
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');
```

### Issue 4: Try-on API fails

**Error**: `Try-on failed`

**Possible causes:**
1. KIE.AI API key missing/invalid
2. Timeout (>30s)
3. Image format unsupported

**Check:**
```bash
# .env.local
KIE_AI_API_KEY=your_key_here
```

---

## Environment Variables Checklist

Required in `.env.local`:

```env
# Supabase (already have)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# OpenAI (already have)
OPENAI_API_KEY=

# KIE.AI for try-on (already have)
KIE_AI_API_KEY=

# Base URL for QR public links (NEW - add this!)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# In production: https://clothify.vercel.app
```

---

## Production Deployment

### 1. Update Environment Variable

```env
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

### 2. Database

All tables already created in Supabase (same database for dev/prod)

### 3. Storage

Ensure `images` bucket has proper policies in production

### 4. Monitoring

**Track:**
- QR scans per day
- Token consumption
- Success rate
- API errors

**Set Alerts:**
- Token balance < 100
- Error rate > 5%
- Unusual scan patterns

---

## Performance Optimization

### For High Traffic

**If you expect >1000 scans/day:**

1. **Add Redis for rate limiting**
   ```typescript
   // Replace in-memory Map with Redis
   import Redis from 'ioredis'
   const redis = new Redis(process.env.REDIS_URL)
   ```

2. **CDN for images**
   - Use Vercel Image Optimization
   - Or CloudFlare CDN

3. **Database indexes**
   Already included in schema ✅

4. **Caching**
   ```typescript
   // Cache QR info for 5 minutes
   const cached = await redis.get(`qr:${code}`)
   ```

---

## Success!

Nếu all tests pass ✅, feature đã sẵn sàng!

**Next Steps:**
1. Create first QR code
2. Test on mobile
3. Share with friends
4. Monitor analytics
5. Iterate based on data

**Questions?** Check `QR_CODES_FEATURE.md` for full docs!

