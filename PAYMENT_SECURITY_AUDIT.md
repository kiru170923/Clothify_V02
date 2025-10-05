# Báo cáo kiểm toán bảo mật hệ thống thanh toán

## Các vấn đề đã phát hiện và đã sửa ✅

### 1. Race Condition khi cộng tokens - ĐÃ SỬA ✅
**Vấn đề**: Hai request đồng thời có thể ghi đè nhau khi cộng tokens.

**Giải pháp**: 
- Tạo function `increment_user_tokens` với UPSERT
- Tạo function `process_payment_completion` với row locking
- File: `database/fix-increment-tokens-function.sql`, `database/create-payment-transaction-function.sql`

### 2. Thiếu validation input - ĐÃ SỬA ✅
**Vấn đề**: Không kiểm tra số lượng tokens hợp lệ (NaN, âm, quá lớn).

**Giải pháp**:
- Thêm validation: MIN_TOKENS = 30, MAX_TOKENS = 1000
- Kiểm tra isNaN và giới hạn
- File: `src/app/api/payment/payos/create-token-order/route.ts`

### 3. Webhook security logging - ĐÃ SỬA ✅
**Vấn đề**: Không log khi signature webhook sai.

**Giải pháp**:
- Thêm logging chi tiết cho webhook
- Log khi signature không hợp lệ
- File: `src/app/api/payment/payos/webhook/route.ts`

### 4. Token consumption validation - ĐÃ SỬA ✅
**Vấn đề**: Không kiểm tra tokensToUse là số nguyên.

**Giải pháp**:
- Thêm `!Number.isInteger(tokensToUse)` validation
- File: `src/app/api/membership/tokens/route.ts`

### 5. Validation billingCycle - ĐÃ SỬA ✅
**Vấn đề**: Không kiểm tra billingCycle hợp lệ trước khi tính amount.

**Giải pháp**:
- Thêm validation: `['monthly', 'yearly'].includes(billingCycle)`
- File: `src/app/api/payment/payos/create/route.ts`

### 6. User existence validation - ĐÃ SỬA ✅
**Vấn đề**: Không kiểm tra user có tồn tại trong DB.

**Giải pháp**:
- Thêm `supabaseAdmin.auth.admin.getUserById(userId)` check
- File: `src/app/api/payment/payos/create/route.ts`

## Các vấn đề cần lưu ý ⚠️

### 1. Schema payment_orders không hỗ trợ token orders
**Vấn đề**: Schema hiện tại:
```sql
plan_id UUID NOT NULL REFERENCES membership_plans(id)
billing_cycle VARCHAR(20) NOT NULL
```

**Tác động**: Không thể lưu token orders vì:
- Token orders không có `plan_id`
- Token orders không có `billing_cycle`

**Giải pháp đề xuất**: Sửa schema:
```sql
plan_id UUID REFERENCES membership_plans(id) -- Bỏ NOT NULL
billing_cycle VARCHAR(20) -- Bỏ NOT NULL
tokens_to_add INTEGER -- Thêm cột này
```

### 2. Thiếu kiểm tra membership đang active
**Vấn đề**: Không chặn mua membership mới khi đang có membership active.

**Tác động**: User có thể mua nhiều membership trùng lặp, gây lãng phí tiền.

**Giải pháp đề xuất**: Thêm check trước khi tạo order:
```typescript
const { data: existingMembership } = await supabaseAdmin
  .from('user_memberships')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'active')
  .gt('end_date', new Date().toISOString())
  .maybeSingle()

if (existingMembership) {
  return NextResponse.json({ 
    error: 'Bạn đang có gói membership hoạt động' 
  }, { status: 400 })
}
```

### 3. Thiếu rate limiting
**Vấn đề**: Không có rate limiting cho API thanh toán.

**Tác động**: 
- Có thể bị spam orders
- Có thể bị tấn công DDoS
- Chi phí API PayOS tăng cao

**Giải pháp đề xuất**: 
- Implement rate limiting: 5 requests/phút/user
- Block IP có hành vi bất thường

### 4. Thiếu monitoring và alerting
**Vấn đề**: Không có monitoring cho:
- Thanh toán thất bại bất thường
- Webhook signature sai nhiều lần
- Orders bị stuck ở trạng thái pending

**Giải pháp đề xuất**:
- Setup monitoring với Sentry/DataDog
- Alert khi:
  - > 10 webhook signature sai trong 1 giờ
  - > 5 thanh toán thất bại liên tiếp của cùng user
  - Orders pending > 2 giờ

### 5. Thiếu backup và recovery
**Vấn đề**: Không có chiến lược backup cho:
- payment_orders table
- user_tokens table
- user_memberships table

**Giải pháp đề xuất**:
- Enable Supabase Point-in-Time Recovery
- Daily backup to external storage
- Test recovery procedure hàng tháng

## Khuyến nghị ưu tiên cao 🔴

1. **SỬA NGAY**: Schema payment_orders để hỗ trợ token orders
2. **SỬA NGAY**: Thêm check membership đang active
3. **SỬA TUẦN TỚI**: Implement rate limiting
4. **SỬA THÁNG NÀY**: Setup monitoring và alerting
5. **KẾ HOẠCH DÀI HẠN**: Backup và recovery strategy

## Các file quan trọng cần chạy

### Bắt buộc chạy ngay:
```sql
-- File 1: Sửa RPC function cộng tokens
database/fix-increment-tokens-function.sql

-- File 2: Tạo transaction function
database/create-payment-transaction-function.sql
```

### Cần chạy sau khi sửa schema:
```sql
-- File 3: Sửa schema payment_orders
-- Cần tạo file migration mới
ALTER TABLE payment_orders 
  ALTER COLUMN plan_id DROP NOT NULL,
  ALTER COLUMN billing_cycle DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS tokens_to_add INTEGER;
```

## Kết luận

Hệ thống thanh toán hiện tại có một số vấn đề bảo mật và logic đã được sửa. Tuy nhiên, vẫn còn một số điểm cần cải thiện để đảm bảo an toàn tuyệt đối, đặc biệt là:

1. Schema không hỗ trợ token orders
2. Thiếu check membership trùng lặp
3. Thiếu rate limiting
4. Thiếu monitoring

**Mức độ nghiêm trọng tổng thể**: TRUNG BÌNH ⚠️

**Khả năng mất tiền/tokens**: THẤP (nhờ các sửa đổi đã thực hiện)

**Khuyến nghị**: Triển khai các sửa đổi còn lại trong vòng 1-2 tuần.
