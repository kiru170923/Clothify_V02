// Membership and Token System Types

export interface MembershipPlan {
  id: string
  name: string
  description: string
  price_monthly: number // Price in VND
  price_yearly: number // Price in VND
  tokens_monthly: number
  tokens_yearly: number
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserMembership {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'expired' | 'cancelled'
  start_date: string
  end_date: string
  billing_cycle: 'monthly' | 'yearly'
  auto_renew: boolean
  created_at: string
  updated_at: string
  plan?: MembershipPlan // Joined plan data
}

export interface UserTokens {
  id: string
  user_id: string
  total_tokens: number
  used_tokens: number
  last_reset_date: string
  created_at: string
  updated_at: string
}

export interface TokenUsageHistory {
  id: string
  user_id: string
  tokens_used: number
  usage_type: 'image_generation' | 'bonus' | 'refund'
  description?: string
  related_image_id?: string
  created_at: string
}

// Membership plan data
export const MEMBERSHIP_PLANS: Omit<MembershipPlan, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Standard',
    description: 'Basic plan for new users',
    price_monthly: 59000,
    price_yearly: 566400, // 59000 * 12 * 0.8
    tokens_monthly: 30,
    tokens_yearly: 360,
    features: ['30 images/month', 'HD Quality', 'Email Support'],
    is_active: true
  },
  {
    name: 'Medium',
    description: 'Popular plan for regular users',
    price_monthly: 99000,
    price_yearly: 950400, // 99000 * 12 * 0.8
    tokens_monthly: 50,
    tokens_yearly: 600,
    features: ['50 images/month', 'HD+ Quality', 'Priority Support', '100 images storage'],
    is_active: true
  },
  {
    name: 'Premium',
    description: 'Premium plan for professional users',
    price_monthly: 159000,
    price_yearly: 1526400, // 159000 * 12 * 0.8
    tokens_monthly: 100,
    tokens_yearly: 1200,
    features: ['100 images/month', '4K Quality', '24/7 Support', 'Unlimited storage', 'API access'],
    is_active: true
  }
]

// Helper functions
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

export function calculateYearlyDiscount(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * 0.8)
}

export function getTokensForPlan(plan: MembershipPlan, billingCycle: 'monthly' | 'yearly'): number {
  return billingCycle === 'monthly' ? plan.tokens_monthly : plan.tokens_yearly
}

export function getPriceForPlan(plan: MembershipPlan, billingCycle: 'monthly' | 'yearly'): number {
  return billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
}
