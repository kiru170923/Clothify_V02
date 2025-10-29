/**
 * useAnalytics Hook
 * Simplifies GA4 tracking in components
 */

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  trackPageView,
  trackSignup,
  trackLogin,
  trackTryOn,
  trackQRGeneration,
  trackQRScan,
  trackPurchase,
  trackTokenPurchase,
  trackSubscription,
  trackChatbot,
  trackWardrobe,
  trackSearch,
  trackShare,
  trackFeatureUsage,
  trackError,
} from '../lib/analytics'

export function useAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    trackPageView(url)
  }, [pathname, searchParams])

  return {
    trackSignup,
    trackLogin,
    trackTryOn,
    trackQRGeneration,
    trackQRScan,
    trackPurchase,
    trackTokenPurchase,
    trackSubscription,
    trackChatbot,
    trackWardrobe,
    trackSearch,
    trackShare,
    trackFeatureUsage,
    trackError,
  }
}

