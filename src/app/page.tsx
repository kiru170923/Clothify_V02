'use client'

import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import FashionChatbot from '../components/FashionChatbot'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          <FashionChatbot />
        </main>
      </div>
    </div>
  )
}