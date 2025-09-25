'use client'

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import Header from '../../../components/Header'
import Sidebar from '../../../components/Sidebar'
import { useSupabase } from '../../../components/SupabaseProvider'
import toast from 'react-hot-toast'
import { useSearchParams, useRouter } from 'next/navigation'

const PRICE_PER_TOKEN = 500 // VND

function BuyTokensContent() {
  const { user, session } = useSupabase() as any
  const searchParams = useSearchParams()
  const router = useRouter()
  const [qty, setQty] = useState<number>(30)
  const amount = useMemo(() => Math.max(30, Math.floor(qty)) * PRICE_PER_TOKEN, [qty])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success) {
      toast.success(success)
      router.replace('/tokens/buy')
    } else if (error) {
      toast.error(error)
      router.replace('/tokens/buy')
    }
  }, [searchParams, router])

  const startPayment = async () => {
    try {
      setLoading(true)
      if (!user) throw new Error('Bạn cần đăng nhập')
      const res = await fetch('/api/payment/payos/create-token-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ userId: user.id, tokens: Math.max(30, Math.floor(qty)) })
      })
      const data = await res.json()
      if (!res.ok || !data.paymentUrl) throw new Error(data.error || 'Tạo thanh toán thất bại')
      window.location.href = data.paymentUrl
    } catch (e:any) {
      toast.error(e.message || 'Lỗi tạo thanh toán')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50" style={{ backgroundColor: '#f6f1e9' }}>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-xl mx-auto bg-white border border-amber-200 rounded-2xl p-6 shadow">
            <h1 className="text-2xl font-bold text-amber-800 mb-2">Mua Tokens</h1>
            <p className="text-sm text-gray-600 mb-6">Giá: 1 token = 500 VND</p>

            <label className="block text-sm text-gray-700 mb-2">Số lượng tokens (tối thiểu 30)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Nhập số lượng (>= 30)"
              value={String(qty)}
              onChange={(e)=>{
                const raw = e.target.value.replace(/[^0-9]/g, '')
                const n = raw === '' ? 0 : parseInt(raw, 10)
                setQty(n)
              }}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4 text-amber-800">
              Tổng tiền: <span className="font-bold">{amount.toLocaleString('vi-VN')} VND</span>
            </div>

            {qty >= 30 ? (
              <button onClick={startPayment} disabled={loading} className="w-full px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">{loading ? 'Đang tạo thanh toán...' : 'Mua'}</button>
            ) : (
              <div className="text-sm text-red-600">Vui lòng nhập tối thiểu 30 tokens để tiếp tục</div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function BuyTokensPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuyTokensContent />
    </Suspense>
  )
}


