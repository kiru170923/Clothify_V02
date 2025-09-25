'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import FashionChatbot from '../components/FashionChatbot'
import { useSupabase } from '../components/SupabaseProvider'

export default function HomePage() {
  const { user, loading, session } = useSupabase() as any
  const router = useRouter()

  useEffect(() => {
    // Only redirect if loading is complete and no user
    if (!loading && !user) {
      router.push('/landing')
    }
  }, [user, loading, router])

  // Redirect to onboarding if missing profile
  useEffect(() => {
    const run = async () => {
      if (!loading && user && session?.access_token) {
        try {
          const res = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${session.access_token}` }})
          const data = await res.json()
          if (res.ok && !data.hasProfile) {
            router.replace('/onboarding')
          }
        } catch {}
      }
    }
    run()
  }, [loading, user, session?.access_token, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center" style={{ backgroundColor: '#f6f1e9' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-amber-600">Đang kiểm tra...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center" style={{ backgroundColor: '#f6f1e9' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-amber-600">Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50" style={{ backgroundColor: '#f6f1e9' }}>
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section for Chat */}
            <div className="text-center mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent mb-4">
                AI Fashion Advisor ✨
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Trợ lý thời trang thông minh của bạn. Gửi link Shopee hoặc chat để nhận tư vấn phong cách cá nhân!
              </p>
            </div>
            
            {/* Fashion Chatbot Component */}
            <FashionChatbot />
          </div>
        </main>
      </div>
    </div>
  )
}