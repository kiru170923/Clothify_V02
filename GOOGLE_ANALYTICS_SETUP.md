# 📊 Google Analytics 4 Setup Guide - Clothify

## ✅ What's Integrated

### 1. Core Setup
- ✅ **@next/third-parties/google** installed
- ✅ **GoogleAnalytics** component integrated in `layout.tsx`
- ✅ Auto page view tracking
- ✅ Custom event tracking library

### 2. Tracking Library (`src/lib/analytics.ts`)

Comprehensive tracking functions for all key events:

**Authentication:**
- `trackSignup(method)` - User registration
- `trackLogin(method)` - User login

**Core Features:**
- `trackTryOn({ success, method, tokensUsed, processingTime })` - Virtual try-on
- `trackQRGeneration({ qrId, hasExpiry, hasMaxUses })` - QR code created
- `trackQRScan({ qrCode, source })` - QR code scanned
- `trackChatbot({ action, messageType, tokensUsed })` - Chatbot interactions
- `trackWardrobe({ action, itemType })` - Wardrobe management
- `trackSearch({ searchTerm, category, resultsCount })` - Product search

**E-commerce:**
- `trackPurchase({ transactionId, value, currency, items })` - Generic purchase
- `trackTokenPurchase({ packageName, tokens, price, currency })` - Token purchase
- `trackSubscription({ plan, price, currency, duration })` - Membership subscription

**Engagement:**
- `trackShare({ contentType, method })` - Content sharing
- `trackFeatureUsage(featureName, metadata)` - Feature usage
- `trackError({ errorType, errorMessage, page })` - Error tracking

### 3. React Hook (`src/hooks/useAnalytics.ts`)

Easy-to-use hook for components:
```typescript
const { trackTryOn, trackPurchase, ... } = useAnalytics()
```

Auto-tracks page views when pathname changes.

---

## 🚀 Setup Instructions

### Step 1: Create Google Analytics 4 Property

1. **Go to Google Analytics**: https://analytics.google.com
2. Click **"Admin"** (bottom left)
3. Click **"Create Property"**
4. Fill in:
   - Property name: `Clothify`
   - Time zone: `Vietnam`
   - Currency: `Vietnamese Dong (₫)`
5. Click **"Next"**
6. Business details:
   - Industry: `Shopping`
   - Business size: Select your size
7. Click **"Create"**
8. Accept Terms of Service

### Step 2: Get Measurement ID

1. In Admin → Property → **Data Streams**
2. Click **"Add stream"** → **"Web"**
3. Fill in:
   - Website URL: `https://www.clothify.top`
   - Stream name: `Clothify Production`
4. Click **"Create stream"**
5. **Copy the Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 3: Add to Vercel Environment Variables

**For Production:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new:
   - Name: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Value: `G-XXXXXXXXXX` (paste your Measurement ID)
   - Environment: **Production** + **Preview**
3. Click **"Save"**
4. **Re-deploy** your app

**For Local Development:**
Create/update `.env.local`:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 4: Verify Installation

1. Start dev server: `npm run dev`
2. Open your site: `http://localhost:3000`
3. Open browser DevTools → Console
4. You should see GA4 debug logs (if enabled)
5. Go to GA4 → Reports → Realtime
6. Should see your visit in real-time!

---

## 📝 How to Use in Code

### Option 1: Using the Hook (Recommended)

```typescript
'use client'

import { useAnalytics } from '@/hooks/useAnalytics'

export default function MyComponent() {
  const { trackTryOn, trackPurchase } = useAnalytics()

  const handleTryOn = async () => {
    const startTime = Date.now()
    
    try {
      // ... your try-on logic ...
      
      const processingTime = Date.now() - startTime
      trackTryOn({
        success: true,
        method: 'upload',
        tokensUsed: 1,
        processingTime
      })
    } catch (error) {
      trackTryOn({
        success: false,
        method: 'upload'
      })
    }
  }

  return <button onClick={handleTryOn}>Try On</button>
}
```

### Option 2: Direct Import

```typescript
import { trackQRScan, trackPurchase } from '@/lib/analytics'

// Track QR scan
trackQRScan({
  qrCode: 'abc123',
  source: 'mobile_camera'
})

// Track purchase
trackPurchase({
  transactionId: 'ORDER-123',
  value: 100000,
  currency: 'VND',
  items: [{
    id: 'TOKENS-50',
    name: '50 Tokens',
    price: 100000,
    quantity: 1
  }]
})
```

---

## 🎯 Key Integration Points

### 1. Try-On Feature (`src/app/try-on/page.tsx`)

**Add tracking:**
```typescript
import { trackTryOn } from '@/lib/analytics'

const handleTryOnSuccess = (result: string) => {
  trackTryOn({
    success: true,
    method: 'upload', // or 'qr' or 'wardrobe'
    tokensUsed: 1,
    processingTime: Date.now() - startTime
  })
}

const handleTryOnError = () => {
  trackTryOn({
    success: false,
    method: 'upload'
  })
}
```

### 2. QR Code Generation (`src/app/qr-codes/new/page.tsx`)

```typescript
import { trackQRGeneration } from '@/lib/analytics'

const onQRCreated = (qrData: any) => {
  trackQRGeneration({
    qrId: qrData.id,
    hasExpiry: !!qrData.expiresAt,
    hasMaxUses: !!qrData.maxUses
  })
}
```

### 3. QR Code Scan (`src/app/try/[code]/page.tsx`)

```typescript
import { trackQRScan } from '@/lib/analytics'

useEffect(() => {
  trackQRScan({
    qrCode: code,
    source: 'direct_link' // or 'qr_scanner'
  })
}, [code])
```

### 4. Token Purchase (`src/app/tokens/buy/page.tsx`)

```typescript
import { trackTokenPurchase } from '@/lib/analytics'

const onPaymentSuccess = (orderData: any) => {
  trackTokenPurchase({
    packageName: orderData.packageName,
    tokens: orderData.tokens,
    price: orderData.amount,
    currency: 'VND'
  })
}
```

### 5. Chatbot Messages (`src/components/FashionChatbot.tsx`)

```typescript
import { trackChatbot } from '@/lib/analytics'

const onMessageSent = (type: 'text' | 'voice' | 'image') => {
  trackChatbot({
    action: 'message_sent',
    messageType: type,
    tokensUsed: type === 'voice' ? 2 : 0
  })
}
```

### 6. User Authentication (`src/components/LoginModal.tsx`)

```typescript
import { trackSignup, trackLogin } from '@/lib/analytics'

const onSignupSuccess = (method: 'google' | 'email') => {
  trackSignup(method)
}

const onLoginSuccess = (method: 'google' | 'email') => {
  trackLogin(method)
}
```

---

## 📊 What You'll See in Google Analytics

### 1. Real-time Reports
- Active users right now
- Page views
- Events happening live
- Traffic sources

### 2. Acquisition Reports
- How users find your site (Google, direct, social media)
- Campaign performance
- Referral sources

### 3. Engagement Reports
- **Events**: All custom events (try_on, qr_scan, purchase, etc.)
- **Pages and screens**: Most visited pages
- **Landing pages**: Entry points
- Session duration, bounce rate

### 4. Monetization Reports (if e-commerce enabled)
- Purchase revenue
- Items purchased
- Average order value
- Conversion rate

### 5. Custom Reports
Create custom dashboards for:
- Try-on success rate by method
- QR code performance
- Token purchase funnel
- Feature adoption rates

---

## 🔍 Debugging

### Check if GA4 is Working

**Method 1: Browser DevTools**
```javascript
// Open Console and run:
typeof window.gtag
// Should return: "function"

// Check if events are being sent:
window.gtag('event', 'test_event', { test_param: 'test_value' })
```

**Method 2: GA4 DebugView**
1. Install **Google Analytics Debugger** Chrome extension
2. Enable it
3. Open your site
4. Go to GA4 → Admin → DebugView
5. Should see events in real-time

**Method 3: Network Tab**
1. Open DevTools → Network tab
2. Filter by: `google-analytics.com`
3. Should see requests being sent

### Common Issues

**Issue 1: No data showing up**
```
Solution:
1. Check NEXT_PUBLIC_GA_MEASUREMENT_ID is set
2. Verify Measurement ID format: G-XXXXXXXXXX
3. Wait 24-48 hours for data to process (Realtime should show immediately)
4. Check if ad blockers are blocking GA
```

**Issue 2: Events not tracking**
```
Solution:
1. Ensure window.gtag is defined
2. Check browser console for errors
3. Verify event names (no spaces, lowercase recommended)
4. Test in incognito mode (no extensions blocking)
```

**Issue 3: Production vs Development data**
```
Solution:
Create separate GA4 properties:
- Production: G-XXXXXXXXXX
- Development: G-YYYYYYYYYY

Use different env vars:
- Production Vercel: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
- Local .env.local: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YYYYYYYYYY
```

---

## 📈 Recommended Custom Reports

### 1. Try-On Funnel
```
Page Views (/) 
  → Try-On Page (/try-on)
    → Try-On Attempted (try_on event)
      → Try-On Success (try_on event, success=true)
```

### 2. QR Performance
```
Explore → Events → qr_code_generated, qr_code_scanned, try_on
Dimensions: qr_code, source
Metrics: Event count, Success rate
```

### 3. Revenue Analysis
```
Monetization → Ecommerce purchases
Add dimensions: package_name, plan
Metrics: Total revenue, Transaction count, Average order value
```

---

## 🎯 Goals & Conversions

Set up key conversions in GA4:

1. **Admin → Events → Mark as conversion:**
   - `sign_up`
   - `purchase`
   - `token_purchase`
   - `subscription`
   - `try_on` (when success=true)

2. **Create audiences:**
   - "Active Try-On Users" - Users who completed try_on in last 7 days
   - "Token Buyers" - Users who completed token_purchase
   - "Premium Members" - Users who completed subscription

---

## 🔐 Privacy & GDPR

### Cookie Consent

If targeting EU users, add cookie consent:

```typescript
// src/components/CookieConsent.tsx
'use client'

import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setShow(true)
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'true')
    setShow(false)
    
    // Enable GA4
    window.gtag?.('consent', 'update', {
      'analytics_storage': 'granted'
    })
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p>We use cookies to improve your experience.</p>
        <button onClick={acceptCookies} className="bg-amber-500 px-4 py-2 rounded">
          Accept
        </button>
      </div>
    </div>
  )
}
```

### Disable Analytics

```typescript
// Opt-out link
const optOutOfAnalytics = () => {
  window['ga-disable-G-XXXXXXXXXX'] = true
  localStorage.setItem('ga-opted-out', 'true')
}
```

---

## 💡 Best Practices

1. **Event Naming**:
   - Use lowercase, snake_case: `try_on`, not `tryOn` or `TryOn`
   - Be descriptive: `token_purchase` not just `purchase`
   - Max 40 characters

2. **Event Parameters**:
   - Keep it simple (max 25 custom parameters per event)
   - Use consistent naming
   - Track what matters for business decisions

3. **Testing**:
   - Always test in DebugView before production
   - Create separate GA4 properties for dev/prod
   - Use test events during development

4. **Performance**:
   - GA4 is async, won't block rendering
   - Events are batched automatically
   - Minimal performance impact

---

## 📚 Resources

- **GA4 Dashboard**: https://analytics.google.com
- **GA4 Documentation**: https://support.google.com/analytics
- **@next/third-parties Docs**: https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries
- **Event Reference**: https://developers.google.com/analytics/devguides/collection/ga4/reference/events

---

## ✅ Quick Checklist

Before going live:

- [ ] GA4 property created
- [ ] Measurement ID copied
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` set in Vercel
- [ ] Deployed to production
- [ ] Verified in GA4 Realtime
- [ ] Key conversions marked (sign_up, purchase, etc.)
- [ ] Cookie consent added (if needed for EU)
- [ ] Team has access to GA4 dashboard

---

**Created**: October 29, 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready to Deploy

