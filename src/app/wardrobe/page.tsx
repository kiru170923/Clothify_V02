'use client'

import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import LazyTab from '../../components/LazyTab'

export default function WardrobePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <LazyTab component="wardrobe" />
          </div>
        </main>
      </div>
    </div>
  )
}
