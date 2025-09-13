'use client'

import { motion } from 'framer-motion'
import { CheckIcon, StarIcon } from '@heroicons/react/24/solid'
import { MembershipPlan } from '../types/membership'
import { formatPrice } from '../types/membership'

interface MembershipCardProps {
  plan: MembershipPlan
  isPopular?: boolean
  billingCycle: 'monthly' | 'yearly'
  onSelect: (plan: MembershipPlan, billingCycle: 'monthly' | 'yearly') => void
  isLoading?: boolean
}

export default function MembershipCard({ 
  plan, 
  isPopular = false, 
  billingCycle, 
  onSelect, 
  isLoading = false 
}: MembershipCardProps) {
  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
  const tokens = billingCycle === 'monthly' ? plan.tokens_monthly : plan.tokens_yearly
  const savings = billingCycle === 'yearly' ? Math.round((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
        isPopular 
          ? 'border-blue-500 shadow-blue-100' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
          >
            <StarIcon className="w-4 h-4" />
            Phổ biến nhất
          </motion.div>
        </div>
      )}

      <div className="p-8">
        {/* Plan name and description */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-600">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">
              {formatPrice(price)}
            </span>
            <span className="text-gray-500">
              /{billingCycle === 'monthly' ? 'tháng' : 'năm'}
            </span>
          </div>
          
          {billingCycle === 'yearly' && savings > 0 && (
            <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <span>Tiết kiệm {savings}%</span>
            </div>
          )}
        </div>

        {/* Tokens */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 rounded-xl border border-blue-200">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-lg font-semibold text-gray-900">
              {tokens} tokens
            </span>
            <span className="text-sm text-gray-600">
              /{billingCycle === 'monthly' ? 'tháng' : 'năm'}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {plan.features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </motion.div>
          ))}
        </div>

        {/* Select button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(plan, billingCycle)}
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
            isPopular
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Đang xử lý...' : 'Chọn gói này'}
        </motion.button>

        {/* Additional info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {billingCycle === 'yearly' ? 'Thanh toán 1 lần/năm' : 'Thanh toán hàng tháng'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Hủy bất cứ lúc nào
          </p>
        </div>
      </div>
    </motion.div>
  )
}
