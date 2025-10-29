'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { useEffect } from 'react'

/**
 * Analytics Wrapper Component
 * Automatically tracks page views
 */
export default function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  useAnalytics() // Auto-track page views

  return <>{children}</>
}

