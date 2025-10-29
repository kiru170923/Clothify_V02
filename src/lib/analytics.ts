/**
 * Google Analytics 4 (GA4) Integration
 * Centralized tracking for all key events
 */

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}

/**
 * Track page view
 */
export const trackPageView = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      page_path: url,
    })
  }
}

/**
 * Track custom event
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, eventParams)
  }
}

// ============================================
// SPECIFIC EVENT TRACKERS
// ============================================

/**
 * Track user signup
 */
export const trackSignup = (method: 'google' | 'email') => {
  trackEvent('sign_up', {
    method,
    event_category: 'engagement',
    event_label: 'User Registration'
  })
}

/**
 * Track user login
 */
export const trackLogin = (method: 'google' | 'email') => {
  trackEvent('login', {
    method,
    event_category: 'engagement',
    event_label: 'User Login'
  })
}

/**
 * Track virtual try-on
 */
export const trackTryOn = (params: {
  success: boolean
  method: 'upload' | 'qr' | 'wardrobe'
  tokensUsed?: number
  processingTime?: number
}) => {
  trackEvent('try_on', {
    success: params.success,
    method: params.method,
    tokens_used: params.tokensUsed,
    processing_time_ms: params.processingTime,
    event_category: 'product_interaction',
    event_label: 'Virtual Try-On'
  })
}

/**
 * Track QR code generation
 */
export const trackQRGeneration = (params: {
  qrId: string
  hasExpiry: boolean
  hasMaxUses: boolean
}) => {
  trackEvent('qr_code_generated', {
    qr_id: params.qrId,
    has_expiry: params.hasExpiry,
    has_max_uses: params.hasMaxUses,
    event_category: 'qr_feature',
    event_label: 'QR Code Created'
  })
}

/**
 * Track QR code scan
 */
export const trackQRScan = (params: {
  qrCode: string
  source?: string
}) => {
  trackEvent('qr_code_scanned', {
    qr_code: params.qrCode,
    source: params.source || 'unknown',
    event_category: 'qr_feature',
    event_label: 'QR Code Scanned'
  })
}

/**
 * Track payment/purchase
 */
export const trackPurchase = (params: {
  transactionId: string
  value: number
  currency: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}) => {
  trackEvent('purchase', {
    transaction_id: params.transactionId,
    value: params.value,
    currency: params.currency,
    items: params.items,
    event_category: 'ecommerce',
    event_label: 'Purchase Completed'
  })
}

/**
 * Track token purchase
 */
export const trackTokenPurchase = (params: {
  packageName: string
  tokens: number
  price: number
  currency: string
}) => {
  trackEvent('token_purchase', {
    package_name: params.packageName,
    tokens: params.tokens,
    price: params.price,
    currency: params.currency,
    event_category: 'ecommerce',
    event_label: 'Tokens Purchased'
  })
}

/**
 * Track membership subscription
 */
export const trackSubscription = (params: {
  plan: string
  price: number
  currency: string
  duration: 'monthly' | 'yearly'
}) => {
  trackEvent('subscription', {
    plan: params.plan,
    price: params.price,
    currency: params.currency,
    duration: params.duration,
    event_category: 'ecommerce',
    event_label: 'Membership Subscribed'
  })
}

/**
 * Track chatbot usage
 */
export const trackChatbot = (params: {
  action: 'message_sent' | 'voice_used' | 'image_uploaded' | 'recommendation_clicked'
  messageType?: 'text' | 'voice' | 'image'
  tokensUsed?: number
}) => {
  trackEvent('chatbot_interaction', {
    action: params.action,
    message_type: params.messageType,
    tokens_used: params.tokensUsed,
    event_category: 'engagement',
    event_label: 'Chatbot Interaction'
  })
}

/**
 * Track wardrobe actions
 */
export const trackWardrobe = (params: {
  action: 'item_added' | 'item_deleted' | 'analysis_run' | 'outfit_created'
  itemType?: string
}) => {
  trackEvent('wardrobe_action', {
    action: params.action,
    item_type: params.itemType,
    event_category: 'engagement',
    event_label: 'Wardrobe Management'
  })
}

/**
 * Track search
 */
export const trackSearch = (params: {
  searchTerm: string
  category?: string
  resultsCount?: number
}) => {
  trackEvent('search', {
    search_term: params.searchTerm,
    category: params.category,
    results_count: params.resultsCount,
    event_category: 'engagement',
    event_label: 'Product Search'
  })
}

/**
 * Track share action
 */
export const trackShare = (params: {
  contentType: 'try_on_result' | 'qr_code' | 'outfit' | 'product'
  method: 'copy_link' | 'social_media' | 'download'
}) => {
  trackEvent('share', {
    content_type: params.contentType,
    method: params.method,
    event_category: 'engagement',
    event_label: 'Content Shared'
  })
}

/**
 * Track feature usage
 */
export const trackFeatureUsage = (featureName: string, metadata?: Record<string, any>) => {
  trackEvent('feature_used', {
    feature_name: featureName,
    ...metadata,
    event_category: 'engagement',
    event_label: 'Feature Usage'
  })
}

/**
 * Track errors
 */
export const trackError = (params: {
  errorType: string
  errorMessage: string
  page: string
}) => {
  trackEvent('error', {
    error_type: params.errorType,
    error_message: params.errorMessage,
    page: params.page,
    event_category: 'technical',
    event_label: 'Error Occurred'
  })
}

