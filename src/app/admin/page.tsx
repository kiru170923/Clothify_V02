'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/SupabaseProvider'
import PaymentManagement from '@/components/admin/PaymentManagement'
import UserManagement from '@/components/admin/UserManagement'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import { 
  Users, 
  TrendingUp,
  CreditCard, 
  ShoppingBag, 
  Activity,
  RefreshCw,
  BarChart3
} from 'lucide-react'

interface DashboardData {
  users: {
    totalUsers: number
    newUsersThisMonth: number
    activeUsers: number
    growthRate: number
  }
  revenue: {
    totalRevenue: number
    monthlyRevenue: number
    mrr: number
    revenueGrowth: number
    avgOrderValue: number
    totalTransactions: number
  }
  engagement: {
    totalTryOns: number
    successRate: number
    totalWardrobeItems: number
    uniqueUsersWithWardrobe: number
  }
  membership: {
    totalActiveMemberships: number
    membershipsByPlan: Array<{
      planName: string
      price: number
      activeCount: number
    }>
    churnRate: number
  }
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useSupabase()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'users' | 'analytics'>('overview')

  const fetchDashboardData = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/dashboard-metrics')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics')
      }
      
      const data = await response.json()
      setDashboardData(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch dashboard data when user is loaded
  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData()
      const interval = setInterval(fetchDashboardData, 30000)
      return () => clearInterval(interval)
    }
  }, [authLoading])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-8 border-b-2 border-black">
          <div>
            <h1 className="text-4xl font-bold text-black mb-1">Bảng điều khiển</h1>
            <p className="text-gray-600 text-sm">
              {lastUpdated ? `Cập nhật lần cuối: ${lastUpdated.toLocaleTimeString('vi-VN')}` : 'Đang tải...'}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="border-2 border-black text-black px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-black hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-8 mb-8 border-b-2 border-black pb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`font-semibold text-lg transition ${
              activeTab === 'overview'
                ? 'text-black border-b-4 border-black pb-2'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`font-semibold text-lg transition ${
              activeTab === 'payments'
                ? 'text-black border-b-4 border-black pb-2'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Thanh toán
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`font-semibold text-lg transition ${
              activeTab === 'users'
                ? 'text-black border-b-4 border-black pb-2'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Người dùng
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`font-semibold text-lg transition ${
              activeTab === 'analytics'
                ? 'text-black border-b-4 border-black pb-2'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            📊 Phân Tích
          </button>
        </div>

        {error && dashboardData && (
          <div className="border-2 border-black rounded-lg p-4 mb-6 bg-gray-100">
            <p className="text-black font-semibold">⚠️ Cảnh báo: {error}</p>
          </div>
        )}

        {/* TAB CONTENT */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-8">
            {/* KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="border-2 border-black rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Tổng người dùng</p>
                    <h3 className="text-3xl font-bold text-black mt-2">
                      {dashboardData.users.totalUsers.toLocaleString()}
                    </h3>
                  </div>
                  <Users className="w-6 h-6 text-black" />
                </div>
                <p className="text-gray-600 text-xs">
                  +{dashboardData.users.newUsersThisMonth} tháng này
                </p>
              </div>

              {/* Monthly Revenue */}
              <div className="border-2 border-black rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Doanh thu hàng tháng</p>
                    <h3 className="text-3xl font-bold text-black mt-2">
                      {formatCurrency(dashboardData.revenue.monthlyRevenue)}
                    </h3>
                  </div>
                  <CreditCard className="w-6 h-6 text-black" />
                </div>
                <p className={`text-xs ${dashboardData.revenue.revenueGrowth >= 0 ? 'text-black' : 'text-black'}`}>
                  {dashboardData.revenue.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(dashboardData.revenue.revenueGrowth).toFixed(1)}% so với tháng trước
                </p>
              </div>

              {/* Active Users */}
              <div className="border-2 border-black rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Người dùng hoạt động</p>
                    <h3 className="text-3xl font-bold text-black mt-2">
                      {dashboardData.users.activeUsers.toLocaleString()}
                    </h3>
                  </div>
                  <Activity className="w-6 h-6 text-black" />
                </div>
                <p className="text-gray-600 text-xs">
                  {((dashboardData.users.activeUsers / dashboardData.users.totalUsers) * 100).toFixed(1)}%
                </p>
              </div>

              {/* Total Transactions */}
              <div className="border-2 border-black rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Giao dịch</p>
                    <h3 className="text-3xl font-bold text-black mt-2">
                      {dashboardData.revenue.totalTransactions}
                    </h3>
                  </div>
                  <ShoppingBag className="w-6 h-6 text-black" />
                </div>
                <p className="text-gray-600 text-xs">
                  Trung bình: {formatCurrency(dashboardData.revenue.avgOrderValue)}
                </p>
              </div>
            </div>

            {/* REVENUE & ENGAGEMENT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border-2 border-black rounded-lg p-6">
                <h2 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-black" />
                  Thông tin doanh thu
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-black">
                    <span className="text-gray-600">Tổng doanh thu (Tất cả thời gian)</span>
                    <span className="text-black font-semibold">{formatCurrency(dashboardData.revenue.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-black">
                    <span className="text-gray-600">Doanh thu lặp lại hàng tháng</span>
                    <span className="text-black font-semibold">{formatCurrency(dashboardData.revenue.mrr)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Trung bình giá trị đơn hàng</span>
                    <span className="text-black font-semibold">{formatCurrency(dashboardData.revenue.avgOrderValue)}</span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-black rounded-lg p-6">
                <h2 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-black" />
                  Thống kê sử dụng
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-black">
                    <span className="text-gray-600">Số lượt thử đồ</span>
                    <span className="text-black font-semibold">{dashboardData.engagement.totalTryOns.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-black">
                    <span className="text-gray-600">Tỷ lệ thành công</span>
                    <span className="text-black font-semibold">{dashboardData.engagement.successRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MEMBERSHIP BREAKDOWN */}
            <div className="border-2 border-black rounded-lg p-6">
              <h2 className="text-lg font-bold text-black mb-6">Membership</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardData.membership.membershipsByPlan.map((plan, idx) => (
                  <div key={idx} className="border border-gray-300 rounded-lg p-4">
                    <h3 className="text-black font-semibold mb-3">{plan.planName}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số lượng:</span>
                        <span className="text-black font-semibold">{plan.activeCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Giá:</span>
                        <span className="text-black font-semibold">{formatCurrency(plan.price)}/tháng</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-black flex justify-between">
                <span className="text-gray-600">Tổng số người dùng Membership</span>
                <span className="text-black font-semibold">{dashboardData.membership.totalActiveMemberships}</span>
              </div>
              {dashboardData.membership.churnRate > 0 && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-600">Tỷ lệ chảy dốc (30 ngày)</span>
                  <span className="text-black font-semibold">{dashboardData.membership.churnRate.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && <PaymentManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  )
}

