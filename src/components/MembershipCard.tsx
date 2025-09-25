'use client'

import { motion } from 'framer-motion'
import { CheckIcon, StarIcon } from '@heroicons/react/24/solid'
import { MembershipPlan } from '../types/membership'
import { formatPrice } from '../types/membership'
import { MembershipResponse } from '../hooks/useMembership'

interface MembershipCardProps {
  plan: MembershipPlan
  isPopular?: boolean
  billingCycle: 'monthly' | 'yearly'
  onSelect: (plan: MembershipPlan, billingCycle: 'monthly' | 'yearly') => void
  isLoading?: boolean
  currentMembership: MembershipResponse | undefined
  loadingMembership: boolean
}

export default function MembershipCard({
  plan,
  isPopular = false,
  billingCycle,
  onSelect,
  isLoading = false,
  currentMembership,
  loadingMembership,
}: MembershipCardProps) {
  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
  const tokens = billingCycle === 'monthly' ? plan.tokens_monthly : plan.tokens_yearly
  const savings = billingCycle === 'yearly' ? Math.round((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12) * 100) : 0

  const isCurrentPlan = 
    !!currentMembership?.membership?.plan &&
    currentMembership.membership.plan.id === plan.id &&
    currentMembership.membership.billing_cycle === billingCycle

  const isLowerPlan = 
    !!currentMembership?.membership?.plan &&
    (billingCycle === 'monthly' 
      ? plan.tokens_monthly < currentMembership.membership.plan.tokens_monthly
      : plan.tokens_yearly < currentMembership.membership.plan.tokens_yearly)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 h-full flex flex-col ${
        isCurrentPlan
          ? 'border-green-500 shadow-green-100'
          : isLowerPlan
          ? 'border-gray-300 opacity-60 cursor-not-allowed'
          : isPopular 
          ? 'border-amber-500 shadow-amber-100' 
          : 'border-amber-200 hover:border-amber-300'
      }`}
    >
      {/* Popular badge */}
      {isPopular && !isCurrentPlan && !isLowerPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-900 px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
          >
            <StarIcon className="w-4 h-4" />
            Most Popular
          </motion.div>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
          >
            <CheckIcon className="w-4 h-4" />
            Current Plan
          </motion.div>
        </div>
      )}

      <div className="p-8 flex flex-col h-full">
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
              /{billingCycle === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
          
          {billingCycle === 'yearly' && savings > 0 && (
            <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <span>Save {savings}%</span>
            </div>
          )}
        </div>

        {/* Tokens */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-lg font-semibold text-amber-900">
              {tokens} tokens
            </span>
            <span className="text-sm text-amber-600">
              /{billingCycle === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8 flex-1">
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
          disabled={isLoading || loadingMembership || isCurrentPlan || isLowerPlan}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
            isCurrentPlan
              ? 'bg-green-500 text-white cursor-default'
              : isLowerPlan
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : isPopular
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 shadow-lg hover:shadow-xl'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } ${isLoading || loadingMembership || isCurrentPlan || isLowerPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loadingMembership ? (
            'Loading...'
          ) : isLoading ? (
            'Processing...'
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : isLowerPlan ? (
            'Lower Plan'
          ) : (
            'Choose Plan'
          )}
        </motion.button>

        {/* Additional info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {billingCycle === 'yearly' ? 'One-time payment/year' : 'Monthly payment'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Cancel anytime
          </p>
        </div>
      </div>
    </motion.div>
  )
}
