'use client'

import { useState } from 'react'
import { useSupabase } from './SupabaseProvider'
import { useMembership } from '../hooks/useMembership'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function TestMembership() {
  const { user } = useSupabase()
  const { data: membershipData, refetch } = useMembership()
  const [testing, setTesting] = useState(false)

  const testMembership = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    setTesting(true)
    try {
      // Lấy plans từ API trước
      const plansResponse = await fetch('/api/membership/plans')
      const plansData = await plansResponse.json()
      
      if (!plansData.plans || plansData.plans.length === 0) {
        toast.error('Không có gói nào khả dụng')
        return
      }

      // Lấy Standard plan (plan đầu tiên)
      const standardPlan = plansData.plans[0]
      
      // Test với Standard plan
      const response = await fetch('/api/test-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          planId: standardPlan.id,
          billingCycle: 'monthly'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Tạo thành viên thành công!')
        // Refetch membership data
        refetch()
      } else {
        toast.error(`Failed: ${result.error}`)
        console.error('Test membership failed:', result)
      }
    } catch (error) {
      toast.error('Lỗi khi kiểm tra thành viên')
      console.error('Error:', error)
    } finally {
      setTesting(false)
    }
  }

  const debugMembership = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Không có token phiên')
        return
      }

      const response = await fetch('/api/debug/membership', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()
      console.log('🔍 Debug membership result:', result)
      
      if (result.debug) {
        toast.success('Kiểm tra console để xem thông tin debug')
      } else {
        toast.error('Debug thất bại')
      }
    } catch (error) {
      toast.error('Lỗi khi debug thành viên')
      console.error('Error:', error)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-bold mb-4">🧪 Test Membership</h3>
      
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-sm"><strong>Người dùng:</strong> {user?.email || 'Chưa đăng nhập'}</p>
          <p className="text-sm"><strong>Gói hiện tại:</strong> {
            membershipData?.membership?.plan?.name || 'Gói miễn phí'
          }</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={testMembership}
            disabled={testing || !user}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {testing ? 'Đang kiểm tra...' : 'Kiểm tra tạo thành viên'}
          </button>

          <button
            onClick={debugMembership}
            disabled={!user}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Debug Membership
          </button>

          <button
            onClick={() => refetch()}
            disabled={!user}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Refresh Membership
          </button>
        </div>
      </div>
    </div>
  )
}
