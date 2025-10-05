'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Switch } from '@headlessui/react'
import MembershipCard from './MembershipCard'
import { MembershipPlan, MEMBERSHIP_PLANS } from '../types/membership'
import { useSupabase } from './SupabaseProvider'
import toast from 'react-hot-toast'
import { useMembership } from '../hooks/useMembership'
import TestMembership from './TestMembership'

export default function MembershipTab() {
  const { user } = useSupabase()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const { data: membershipData, isLoading: loadingMembership } = useMembership()

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

  const handleSelectPlan = async (plan: MembershipPlan, cycle: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để chọn gói thành viên')
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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-amber-600">Đang tải gói thành viên...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent mb-4"
        >
          Choose Membership Plan
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-600"
        >
          Upgrade your account to get more tokens and better AI experience
        </motion.p>
      </div>

      {/* Billing Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-4"
      >
        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-amber-700' : 'text-gray-500'}`}>
          Monthly
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
        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-amber-700' : 'text-gray-500'}`}>
          Yearly
        </span>
        {billingCycle === 'yearly' && (
          <span className="bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Save 20%
          </span>
        )}
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
            currentMembership={membershipData}
            loadingMembership={loadingMembership}
          />
        ))}
      </div>

      {/* Test Component - Remove in production */}
      <div className="mt-8">
        <TestMembership />
      </div>
    </div>
  )
}
