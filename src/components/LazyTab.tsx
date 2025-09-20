'use client'

import { Suspense, lazy } from 'react'

// Lazy load components to improve initial page load
const HistoryTab = lazy(() => import('./HistoryTab').then(module => ({ default: module.HistoryTab })))
const WardrobeTab = lazy(() => import('./WardrobeTab').then(module => ({ default: module.WardrobeTab })))
const ProfileTab = lazy(() => import('./ProfileTab').then(module => ({ default: module.ProfileTab })))
const MembershipTab = lazy(() => import('./MembershipTab'))
const SettingsTab = lazy(() => import('./SettingsTab').then(module => ({ default: module.SettingsTab })))

interface LazyTabProps {
  component: 'history' | 'wardrobe' | 'profile' | 'membership' | 'settings'
}

export default function LazyTab({ component }: LazyTabProps) {
  const Component = {
    history: HistoryTab,
    wardrobe: WardrobeTab,
    profile: ProfileTab,
    membership: MembershipTab,
    settings: SettingsTab,
  }[component]

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Đang tải...</span>
      </div>
    }>
      <Component />
    </Suspense>
  )
}
