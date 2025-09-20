'use client'

import React from 'react'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import MembershipTab from '../../components/MembershipTab'
import AuthGuard from '../../components/AuthGuard'

export default function Membership() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50" style={{ backgroundColor: '#f6f1e9' }}>
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <MembershipTab />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
