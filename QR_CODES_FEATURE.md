# 📱 QR Codes Virtual Try-On Feature

## Overview

Tính năng QR Codes cho phép người dùng tạo mã QR để chia sẻ khả năng thử đồ ảo với người khác. Khi quét QR, người dùng có thể tải ảnh của mình lên và thử sản phẩm ngay lập tức.

## Features

### ✅ Core Features
- **Tạo QR Code** từ ảnh sản phẩm hoặc từ tủ đồ
- **Public Try-On Page** - không cần đăng nhập để thử đồ
- **Token Management** - tự động trừ token từ người tạo QR
- **QR Analytics** - theo dõi số lần quét, success rate, tokens spent
- **Enable/Disable** - bật/tắt QR bất cứ lúc nào
- **Expiry & Limits** - đặt giới hạn số lần quét và ngày hết hạn

### ⭐ Bonus Features
- **3 Export Formats:**
  1. **Plain QR** - Chỉ mã QR (512x512px)
  2. **QR + Image** - QR ở góc ảnh sản phẩm + branding text
  3. **Full Branded** - Layout chuyên nghiệp 1080x1080px (Instagram-ready)
- **Rate Limiting** - chống spam (5 lần/giờ/IP)
- **Analytics Dashboard** - xem chi tiết scans, success rate
- **Anti-Abuse** - kiểm tra token, expiry, max uses

---

## Setup Instructions

### 1. Database Setup

Chạy SQL trong Supabase SQL Editor:

\`\`\`bash
# File: database/qr-codes-schema.sql
\`\`\`

SQL này sẽ tạo:
- ✅ `qr_codes` table
- ✅ `qr_scan_history` table
- ✅ RLS policies
- ✅ Helper functions
- ✅ Indexes
- ✅ Analytics view

### 2. Install Dependencies

\`\`\`bash
npm install qrcode qrcode.react @types/qrcode
\`\`\`

### 3. Environment Variables

Thêm vào `.env.local`:

\`\`\`env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
# Or for development:
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

### 4. Storage Bucket

Tạo bucket trong Supabase Storage nếu chưa có:
- Bucket name: `images`
- Public access: Yes
- Policies: Allow authenticated uploads

---

## File Structure

\`\`\`
src/
├── app/
│   ├── api/
│   │   └── qr/
│   │       ├── generate/route.ts        # POST - Tạo QR code
│   │       ├── list/route.ts            # GET - List QR codes
│   │       └── [code]/
│   │           ├── info/route.ts        # GET - Lấy info QR (public)
│   │           ├── try-on/route.ts      # POST - Try-on (public)
│   │           └── status/route.ts      # PATCH/DELETE - Update/Delete QR
│   ├── qr-codes/
│   │   ├── page.tsx                     # Dashboard quản lý QR
│   │   └── new/page.tsx                 # Tạo QR mới
│   └── try/
│       └── [code]/page.tsx              # Public try-on page
├── lib/
│   └── qrExporter.ts                    # QR export utilities
└── database/
    └── qr-codes-schema.sql              # Database schema
\`\`\`

---

## Usage Guide

### For Users (Tạo và quản lý QR)

#### 1️⃣ Tạo QR Code

1. Vào **QR Codes** trong menu sidebar
2. Click **"Tạo QR mới"**
3. Nhập thông tin:
   - **Tên QR** (VD: "Áo polo TORANO")
   - **Ảnh sản phẩm** (upload hoặc từ tủ đồ)
   - **Giới hạn** (tùy chọn): số lần quét tối đa
   - **Hết hạn** (tùy chọn): ngày hết hạn
4. Click **"Tạo QR Code"**
5. QR được tạo với URL: `clothify.com/try/{code}`

#### 2️⃣ Xuất QR Code

Có 3 format xuất:

**📱 Plain QR (512x512px)**
- Chỉ mã QR đơn giản
- Dùng cho: print nhỏ, sticker, business card

**🖼️ QR + Ảnh sản phẩm**
- QR ở góc dưới phải ảnh
- Text: "Quét để thử ngay với Clothify"
- Dùng cho: catalog, poster, flyer

**⭐ Full Branding (1080x1080px)**
- Layout chuyên nghiệp
- Ảnh sản phẩm + QR + branding
- Dùng cho: Instagram, Facebook, marketing materials

#### 3️⃣ Quản lý QR

Dashboard `/qr-codes` cho phép:
- ✅ **Xem danh sách** tất cả QR codes
- ✅ **Theo dõi analytics**: scans, success rate, tokens spent
- ✅ **Enable/Disable** QR bất cứ lúc nào
- ✅ **Xóa** QR không cần thiết
- ✅ **Xem chi tiết** từng QR code

### For Public (Người quét QR)

#### 1️⃣ Quét QR Code

1. Quét QR bằng camera điện thoại
2. Tự động mở: `clothify.com/try/{code}`
3. Trang hiển thị:
   - Ảnh sản phẩm
   - Upload zone cho ảnh của bạn

#### 2️⃣ Thử đồ

1. Click **"Chọn ảnh của bạn"**
2. Chọn ảnh full-body hoặc half-body
3. Preview ảnh đã chọn
4. Click **"Thử ngay!"**
5. Đợi xử lý (~15-30 giây)
6. Xem kết quả

#### 3️⃣ Tải kết quả

- Click **"Tải xuống"** để lưu ảnh
- Hoặc **"Thử lại"** với ảnh khác

---

## API Reference

### 1. Generate QR Code

\`\`\`typescript
POST /api/qr/generate
Headers: Authorization: Bearer {token}
Body: {
  clothingImageUrl: string,
  wardrobeItemId?: string,
  name?: string,
  maxUses?: number,
  expiresAt?: string (ISO 8601)
}

Response: {
  success: true,
  qrCode: {
    id: string,
    code: string,
    name: string,
    clothingImageUrl: string,
    publicUrl: string,
    createdAt: string,
    isActive: boolean
  }
}
\`\`\`

### 2. List QR Codes

\`\`\`typescript
GET /api/qr/list?page=1&limit=20&status=all
Headers: Authorization: Bearer {token}

Response: {
  success: true,
  qrCodes: [...],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
\`\`\`

### 3. Get QR Info (Public)

\`\`\`typescript
GET /api/qr/{code}/info
No authentication required

Response: {
  success: true,
  qrCode: {
    code: string,
    name: string,
    clothingImageUrl: string,
    isActive: boolean,
    isUsable: boolean,
    isExpired: boolean,
    isMaxUsesReached: boolean,
    maxUses?: number,
    currentScans: number
  }
}
\`\`\`

### 4. Try-On (Public)

\`\`\`typescript
POST /api/qr/{code}/try-on
No authentication required
Content-Type: multipart/form-data
Body: FormData {
  userImage: File
}

Response: {
  success: true,
  resultImageUrl: string,
  tokensRemaining: number
}

Errors:
- 402: Owner has insufficient tokens
- 403: QR is disabled
- 410: QR expired or max uses reached
- 429: Rate limit exceeded (5 per hour per IP)
\`\`\`

### 5. Update QR Status

\`\`\`typescript
PATCH /api/qr/{code}/status
Headers: Authorization: Bearer {token}
Body: {
  isActive: boolean
}

Response: {
  success: true,
  qrCode: {
    code: string,
    isActive: boolean,
    updatedAt: string
  }
}
\`\`\`

### 6. Delete QR

\`\`\`typescript
DELETE /api/qr/{code}/status
Headers: Authorization: Bearer {token}

Response: {
  success: true,
  message: "QR code deleted successfully"
}
\`\`\`

---

## Token Economics

### Cost Structure

| Action | Tokens | Who Pays |
|--------|--------|----------|
| Create QR | 0 | Free |
| Scan QR | 0 | Free |
| Successful Try-On | 1 | QR Owner |

### Example Scenarios

**Scenario 1: Retail Store**
- Tạo 10 QR codes (free)
- Mỗi QR được quét 50 lần/tháng
- Success rate: 80%
- Tokens spent: 10 × 50 × 0.8 = **400 tokens/tháng**

**Scenario 2: Instagram Marketing**
- Tạo 1 QR code trong post
- Viral: 1000 scans
- Success rate: 60%
- Tokens spent: 1 × 1000 × 0.6 = **600 tokens**

**Scenario 3: Fashion Event**
- Tạo 5 QR codes cho 5 outfits
- Event có 200 guests
- Average 2 try-ons per guest
- Tokens spent: 200 × 2 = **400 tokens**

### Recommendations

- **Small Business**: 500 tokens/month (~$25)
- **Medium Store**: 2000 tokens/month (~$100)
- **Large Campaign**: 5000+ tokens (~$250+)

---

## Security Features

### 1. Rate Limiting
- **5 attempts per hour per IP** per QR code
- Prevents token drainage attacks
- Automatic reset after 1 hour

### 2. Token Validation
- Check owner's tokens before processing
- Prevent try-on if insufficient tokens
- Clear error messages

### 3. QR Code Validation
- Check active status
- Check expiry date
- Check max uses limit
- Return appropriate HTTP codes

### 4. RLS (Row Level Security)
- Users can only manage their own QRs
- Public can only view active QRs
- Scan history only visible to owner

---

## Use Cases

### 🏪 Retail Stores
**Scenario**: Physical clothing store

**Implementation**:
1. Print QR codes với ảnh sản phẩm
2. Dán lên mannequin hoặc treo gần sản phẩm
3. Khách hàng quét → thử đồ ngay tại chỗ
4. Không cần app, không cần account

**Benefits**:
- Reduce fitting room congestion
- Increase engagement
- Track customer interest
- Bridge offline-online

### 📱 Social Media Marketing
**Scenario**: Instagram fashion post

**Implementation**:
1. Tạo QR branded full (1080x1080)
2. Post lên Instagram
3. Caption: "Quét QR để thử outfit này!"
4. Track engagement qua analytics

**Benefits**:
- Viral potential
- Direct engagement
- Measurable ROI
- User-generated content

### 🎪 Fashion Events
**Scenario**: Fashion show hoặc pop-up event

**Implementation**:
1. Tạo QR cho mỗi outfit trong show
2. In catalog với QR codes
3. Attendees quét để thử looks
4. Collect data on popular items

**Benefits**:
- Interactive experience
- Instant feedback
- Lead generation
- Post-event engagement

### 🛍️ E-Commerce
**Scenario**: Online product listings

**Implementation**:
1. Add QR code to product pages
2. Customers scan with phone
3. Try-on without account
4. Increase conversion

**Benefits**:
- Lower return rates
- Better fit confidence
- Cross-device experience
- Reduce friction

---

## Best Practices

### Creating Effective QRs

✅ **DO:**
- Use high-quality product images
- Give descriptive names
- Set reasonable expiry dates
- Monitor token balance
- Track analytics regularly

❌ **DON'T:**
- Use low-resolution images
- Share QRs without token budget
- Forget to disable unused QRs
- Ignore analytics data

### Optimizing Success Rate

**Image Quality Tips:**
- Clear background
- Good lighting
- Full product view
- Multiple angles (if possible)

**User Instructions:**
- Prompt for full-body photos
- Suggest good lighting
- Recommend standing straight
- Show example images

### Token Management

**Monitoring:**
- Check dashboard daily for high-traffic QRs
- Set alerts for low tokens (<10)
- Plan token budget for campaigns

**Optimization:**
- Disable QRs after campaigns
- Set max uses for limited campaigns
- Use expiry dates for seasonal items

---

## Troubleshooting

### QR Not Working

**Problem**: QR code không quét được

**Solutions**:
1. Check if QR is active: `/qr-codes` dashboard
2. Verify expiry date
3. Check max uses limit
4. Re-generate QR if corrupted

### Try-On Fails

**Problem**: Try-on không thành công

**Possible Causes**:
1. **Insufficient tokens** - Owner hết token
   - Solution: Mua thêm tokens
2. **Rate limited** - Quá nhiều attempts
   - Solution: Đợi 1 giờ
3. **Poor image quality** - Ảnh user không đủ tốt
   - Solution: Tải ảnh rõ hơn
4. **API timeout** - Server quá tải
   - Solution: Thử lại sau

### High Token Usage

**Problem**: Tokens tiêu hao nhanh

**Investigation**:
1. Check analytics: Scans vs Success rate
2. Look for unusual activity patterns
3. Check if QR is being spammed

**Solutions**:
- Disable high-traffic QRs temporarily
- Set max uses limit
- Add expiry dates
- Contact support if abuse suspected

---

## Analytics & Metrics

### Dashboard Metrics

**Per QR Code:**
- **Total Scans**: Tổng số lần quét
- **Successful Try-ons**: Số lần try-on thành công
- **Tokens Spent**: Tổng tokens đã tiêu
- **Success Rate**: % try-on thành công
- **Last Scanned**: Lần quét cuối cùng

**Aggregate:**
- Total QRs created
- Total scans across all QRs
- Total tokens spent
- Average success rate

### Interpreting Data

**Good Success Rate**: 60-80%
- Indicates good UX
- Quality QR placements
- Clear instructions

**Low Success Rate**: <40%
- Poor image quality
- Confusing instructions
- Technical issues

**High Token Usage**: >500/day
- Viral campaign
- Popular QR
- Monitor closely

---

## API Integration (for Advanced Users)

### Generate QR Programmatically

\`\`\`typescript
const createQR = async (clothingImageUrl: string) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  const res = await fetch('/api/qr/generate', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${session.access_token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clothingImageUrl,
      name: 'My Product QR',
      maxUses: 100,
      expiresAt: '2024-12-31'
    })
  })
  
  const data = await res.json()
  console.log('QR Created:', data.qrCode.publicUrl)
}
\`\`\`

### Batch QR Generation

\`\`\`typescript
const createBatchQRs = async (products: Array<{url: string, name: string}>) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  const results = await Promise.all(
    products.map(product => 
      fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${session.access_token}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clothingImageUrl: product.url,
          name: product.name
        })
      }).then(r => r.json())
    )
  )
  
  console.log(\`Created \${results.length} QR codes\`)
  return results
}
\`\`\`

---

## Roadmap

### Phase 2 (Future Enhancements)

- [ ] **QR Templates** - Pre-designed branded templates
- [ ] **Batch Operations** - Create/manage multiple QRs at once
- [ ] **Advanced Analytics** - Geographic data, time-based trends
- [ ] **Webhooks** - Real-time notifications on scans
- [ ] **QR Campaigns** - Group QRs for coordinated tracking
- [ ] **API Access** - REST API for external integrations
- [ ] **White-Label QRs** - Custom branding for premium users
- [ ] **Mobile App** - Native QR scanner app
- [ ] **NFC Support** - Tap-to-try with NFC tags
- [ ] **Social Sharing** - Share try-on results directly

### Phase 3 (Enterprise Features)

- [ ] **Multi-user Teams** - Shared QR management
- [ ] **Custom Domains** - `your-brand.com/try/{code}`
- [ ] **SSO Integration** - Enterprise authentication
- [ ] **Advanced Security** - IP whitelisting, geo-restrictions
- [ ] **SLA & Support** - Dedicated support channel
- [ ] **Custom Try-On Models** - Brand-specific AI models

---

## FAQ

**Q: Tốn bao nhiêu token mỗi lần quét?**
A: 0 tokens cho việc quét. Chỉ tốn 1 token khi try-on thành công.

**Q: Người quét QR có cần tài khoản Clothify không?**
A: Không. Public page không yêu cầu đăng nhập.

**Q: Giới hạn số lượng QR có thể tạo?**
A: Không giới hạn. Tạo thoải mái.

**Q: QR code có hết hạn không?**
A: Tùy bạn. Có thể set expiry date hoặc để vô thời hạn.

**Q: Ai trả tokens khi có người quét?**
A: Người tạo QR trả tokens.

**Q: Nếu hết tokens thì sao?**
A: QR vẫn quét được nhưng try-on sẽ fail. Người quét thấy message "Owner hết tokens".

**Q: Có thể thu hồi QR đã phát hành?**
A: Có. Disable trong dashboard, QR ngay lập tức không dùng được.

**Q: Dữ liệu try-on có được lưu không?**
A: Có. Lưu trong `qr_scan_history` để analytics. Images auto-cleanup sau 30 ngày.

**Q: Bảo mật như thế nào?**
A: Rate limiting, RLS policies, token validation, image size limits.

---

## Support

Nếu có vấn đề hoặc câu hỏi:
1. Check troubleshooting section
2. Review API docs
3. Check Supabase logs
4. Contact support team

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Author**: Clothify Team

