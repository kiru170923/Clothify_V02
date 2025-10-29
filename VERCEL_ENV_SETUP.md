# ⚙️ Vercel Environment Variables Setup

## CRITICAL: Set Production URL for QR Codes

### Problem
QR codes hiển thị `localhost` thay vì production URL

### Solution

**Vào Vercel Dashboard:**

1. Go to: https://vercel.com/your-team/clothify-v02
2. Click **Settings** tab
3. Click **Environment Variables** (sidebar)
4. Click **Add New**

### Add This Variable:

```
Name:  NEXT_PUBLIC_BASE_URL
Value: https://your-production-domain.vercel.app
```

**Ví dụ:**
- Nếu domain là `clothify-v02.vercel.app`:
  ```
  Value: https://clothify-v02.vercel.app
  ```

- Nếu có custom domain `clothify.com`:
  ```
  Value: https://clothify.com
  ```

**Apply to:**
- ✅ Production
- ✅ Preview
- ⚠️ Development (keep as localhost)

**Click Save**

---

## Re-deploy After Adding Variable

**Option 1: Trigger Re-deploy**
```
Vercel Dashboard → Deployments → Click "..." → Redeploy
```

**Option 2: Git Push (Empty Commit)**
```bash
git commit --allow-empty -m "chore: trigger redeploy for env vars"
git push origin main
```

---

## Verify

After re-deploy, test QR:

1. Tạo QR mới tại: `https://your-domain.com/qr-codes/new`
2. View QR detail
3. Check **publicUrl** field
4. Should be: `https://your-domain.com/try/{code}` ✅
5. NOT: `http://localhost:3000/try/{code}` ❌

---

## All Required Environment Variables

**In Vercel, make sure you have:**

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# OpenAI
OPENAI_API_KEY=sk-xxx

# KIE.AI
KIE_AI_API_KEY=xxx

# Production URL (NEW!)
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

---

## Quick Check

**After adding env var, verify:**

```bash
# In Vercel Dashboard → Settings → Environment Variables
# Should see NEXT_PUBLIC_BASE_URL with your production URL
```

**Or via Vercel CLI (if installed):**
```bash
vercel env ls
# Should show NEXT_PUBLIC_BASE_URL
```

---

## Status: Ready to Fix! 🚀

1. Add `NEXT_PUBLIC_BASE_URL` to Vercel
2. Re-deploy
3. QR codes sẽ có production URL!

