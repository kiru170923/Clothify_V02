'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Switch } from '@headlessui/react'
import MembershipCard from './MembershipCard'
import { MembershipPlan, MEMBERSHIP_PLANS } from '../types/membership'
import { useSupabase } from './SupabaseProvider'
import toast from 'react-hot-toast'
import AuthGuard from './AuthGuard'

export default function MembershipPage() {
  const { user } = useSupabase()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/membership/plans')
        if (response.ok) {
          const data = await response.json()
          setPlans(data.plans)
        } else {
          // Fallback to local plans if API fails
          setPlans(MEMBERSHIP_PLANS as MembershipPlan[])
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
        // Fallback to local plans
        setPlans(MEMBERSHIP_PLANS as MembershipPlan[])
      } finally {
        setLoadingPlans(false)
      }
    }

    fetchPlans()
  }, [])

  // Handle payment result notifications
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success) {
      toast.success(decodeURIComponent(success))
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error) {
      toast.error(decodeURIComponent(error))
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])


  const handleSelectPlan = async (plan: MembershipPlan, cycle: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để chọn gói membership')
      return
    }

    setLoadingPlanId(plan.id)
    
    try {
      // Tạo thanh toán PayOS
      const response = await fetch('/api/payment/payos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle: cycle,
          userId: user.id
        })
      })

      const data = await response.json()

      if (data.success && data.paymentUrl) {
        // Chuyển hướng đến PayOS
        window.location.href = data.paymentUrl
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo thanh toán')
      }
      
    } catch (error) {
      console.error('Error selecting plan:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi chọn gói. Vui lòng thử lại.')
    } finally {
      setLoadingPlanId(null)
    }
  }

  if (loadingPlans) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center" style={{ backgroundColor: '#f6f1e9' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải các gói membership...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50" style={{ backgroundColor: '#f6f1e9' }}>
        <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Chọn gói Membership
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Nâng cấp tài khoản để có thêm tokens và trải nghiệm AI tốt hơn
          </p>

          {/* Billing cycle toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-lg font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Hàng tháng
            </span>
            <Switch
              checked={billingCycle === 'yearly'}
              onChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </Switch>
            <span className={`text-lg font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Hàng năm
            </span>
            {billingCycle === 'yearly' && (
              <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                Tiết kiệm 20%
              </span>
            )}
          </div>
        </motion.div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <MembershipCard
              key={plan.id || index}
              plan={plan}
              isPopular={index === 1} // Medium plan is popular
              billingCycle={billingCycle}
              onSelect={handleSelectPlan}
              isLoading={loadingPlanId === plan.id}
            />
          ))}
        </div>

        {/* Features comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            So sánh các tính năng
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Tính năng</th>
                  {plans.map((plan, index) => (
                    <th key={index} className="text-center py-4 px-4 font-semibold text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">Tokens/{(billingCycle === 'monthly' ? 'tháng' : 'năm')}</td>
                  {plans.map((plan, index) => (
                    <td key={index} className="text-center py-4 px-4">
                      <span className="font-semibold text-amber-600">
                        {billingCycle === 'monthly' ? plan.tokens_monthly : plan.tokens_yearly}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">Giá/{(billingCycle === 'monthly' ? 'tháng' : 'năm')}</td>
                  {plans.map((plan, index) => (
                    <td key={index} className="text-center py-4 px-4">
                      <span className="font-semibold text-green-600">
                        {billingCycle === 'monthly' ? plan.price_monthly.toLocaleString() : plan.price_yearly.toLocaleString()}đ
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">Hỗ trợ</td>
                  {plans.map((plan, index) => (
                    <td key={index} className="text-center py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {plan.features.includes('Hỗ trợ 24/7') ? '24/7' : 
                         plan.features.includes('Hỗ trợ ưu tiên') ? 'Ưu tiên' : 'Email'}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-700">Lưu trữ</td>
                  {plans.map((plan, index) => (
                    <td key={index} className="text-center py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {plan.features.includes('Lưu trữ không giới hạn') ? 'Không giới hạn' : 
                         plan.features.includes('Lưu trữ 100 ảnh') ? '100 ảnh' : 'Cơ bản'}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Câu hỏi thường gặp
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Token được sử dụng như thế nào?</h3>
              <p className="text-gray-600 text-sm">
                Mỗi lần tạo ảnh AI sẽ tốn 1 token. Tokens sẽ được reset về số lượng ban đầu mỗi tháng/năm tùy theo gói bạn chọn.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Có thể hủy gói bất cứ lúc nào không?</h3>
              <p className="text-gray-600 text-sm">
                Có, bạn có thể hủy gói membership bất cứ lúc nào. Gói sẽ hoạt động đến hết chu kỳ thanh toán hiện tại.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Tokens không dùng có bị mất không?</h3>
              <p className="text-gray-600 text-sm">
                Tokens không sử dụng sẽ không được chuyển sang chu kỳ tiếp theo. Chúng sẽ được reset về số lượng ban đầu.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Có thể nâng cấp/giảm cấp gói không?</h3>
              <p className="text-gray-600 text-sm">
                Có, bạn có thể thay đổi gói bất cứ lúc nào. Phí sẽ được tính theo tỷ lệ thời gian còn lại.
              </p>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </AuthGuard>
  )
}
