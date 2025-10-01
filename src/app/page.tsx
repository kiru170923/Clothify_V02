'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '../components/SupabaseProvider'

export default function HomePage() {
  const { user, loading } = useSupabase() as any
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/landing')
      } else {
        router.push('/try-on')
      }
    }
  }, [user, loading, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center" style={{ backgroundColor: '#f6f1e9' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-amber-600">Đang chuyển hướng...</p>
      </div>
    </div>
  )
}