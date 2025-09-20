'use client'

import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import FashionChatbot from '../components/FashionChatbot'

export default function HomePage() {
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