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
    description: 'Gói cơ bản cho người dùng mới',
    price_monthly: 59000,
    price_yearly: 566400, // 59000 * 12 * 0.8
    tokens_monthly: 30,
    tokens_yearly: 360,
    features: ['30 ảnh/tháng', 'Chất lượng HD', 'Hỗ trợ email'],
    is_active: true
  },
  {
    name: 'Medium',
    description: 'Gói phổ biến cho người dùng thường xuyên',
    price_monthly: 99000,
    price_yearly: 950400, // 99000 * 12 * 0.8
    tokens_monthly: 50,
    tokens_yearly: 600,
    features: ['50 ảnh/tháng', 'Chất lượng HD+', 'Hỗ trợ ưu tiên', 'Lưu trữ 100 ảnh'],
    is_active: true
  },
  {
    name: 'Premium',
    description: 'Gói cao cấp cho người dùng chuyên nghiệp',
    price_monthly: 159000,
    price_yearly: 1526400, // 159000 * 12 * 0.8
    tokens_monthly: 100,
    tokens_yearly: 1200,
    features: ['100 ảnh/tháng', 'Chất lượng 4K', 'Hỗ trợ 24/7', 'Lưu trữ không giới hạn', 'API access'],
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
