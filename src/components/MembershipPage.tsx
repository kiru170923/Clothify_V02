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

        </div>
      </div>
    </AuthGuard>
  )
}
