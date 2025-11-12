'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, DollarSign, Users, Activity, Target, BarChart3 } from 'lucide-react'

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number }>
  revenueChart: Array<{ date: string; revenue: number }>
  activityChart: Array<{ date: string; tryOns: number; chats: number }>
  topFeatures: Array<{ feature: string; usage: number; growth: number }>
  userSegments: Array<{ segment: string; count: number; percentage: number }>
  conversionFunnel: Array<{ stage: string; users: number; conversion: number }>
  summary: {
    totalUsers: number
    totalRevenue: number
    totalTryOns: number
    totalChats: number
    premiumUsers: number
  }
}

const COLORS = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB']

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-600">Không có dữ liệu</div>
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between border-2 border-black rounded-lg p-4">
        <h2 className="text-xl font-bold text-black flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Phân Tích Số Liệu
        </h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                timeRange === range
                  ? 'bg-black text-white'
                  : 'border-2 border-black text-black hover:bg-gray-100'
              }`}
            >
              {range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : '90 ngày'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="border-2 border-black rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-black" />
            <span className="text-xs text-gray-600">Tổng Users</span>
          </div>
          <h3 className="text-2xl font-bold text-black">{data.summary.totalUsers}</h3>
        </div>

        <div className="border-2 border-black rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-black" />
            <span className="text-xs text-gray-600">Doanh Thu</span>
          </div>
          <h3 className="text-2xl font-bold text-black">{formatCurrency(data.summary.totalRevenue)}</h3>
        </div>

        <div className="border-2 border-black rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-black" />
            <span className="text-xs text-gray-600">Try-Ons</span>
          </div>
          <h3 className="text-2xl font-bold text-black">{data.summary.totalTryOns}</h3>
        </div>

        <div className="border-2 border-black rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-black" />
            <span className="text-xs text-gray-600">Chats</span>
          </div>
          <h3 className="text-2xl font-bold text-black">{data.summary.totalChats}</h3>
        </div>

        <div className="border-2 border-black rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-black" />
            <span className="text-xs text-gray-600">Premium</span>
          </div>
          <h3 className="text-2xl font-bold text-black">{data.summary.premiumUsers}</h3>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="border-2 border-black rounded-lg p-6">
        <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Tăng Trưởng Người Dùng
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.userGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '2px solid #000' }}
              formatter={(value: any) => [`${value} người dùng`, 'Người dùng mới']}
            />
            <Area 
              type="monotone" 
              dataKey="users" 
              stroke="#000" 
              fill="#000" 
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Chart */}
      <div className="border-2 border-black rounded-lg p-6">
        <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Doanh Thu Theo Ngày
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.revenueChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '2px solid #000' }}
              formatter={(value: any) => formatCurrency(value)}
            />
            <Bar dataKey="revenue" fill="#000" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border-2 border-black rounded-lg p-6">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Hoạt Động Người Dùng
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.activityChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '2px solid #000' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="tryOns" 
                stroke="#000" 
                strokeWidth={2}
                name="Try-Ons"
                dot={{ fill: '#000', r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="chats" 
                stroke="#4B5563" 
                strokeWidth={2}
                name="Chats"
                dot={{ fill: '#4B5563', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Segments Pie Chart */}
        <div className="border-2 border-black rounded-lg p-6">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Phân Khúc Người Dùng
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.userSegments}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => {
                  const total = data.userSegments.reduce((sum, item) => sum + item.count, 0)
                  const percentage = total > 0 ? (entry.count / total * 100).toFixed(1) : '0'
                  return `${entry.segment}: ${percentage}%`
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.userSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '2px solid #000' }}
                formatter={(value: any, name: string, props: any) => {
                  const total = data.userSegments.reduce((sum, item) => sum + item.count, 0)
                  const percentage = total > 0 ? ((props.payload.count / total) * 100).toFixed(1) : '0'
                  return [`${value} người dùng (${percentage}%)`, props.payload.segment]
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="border-2 border-black rounded-lg p-6">
        <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Conversion Funnel
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.conversionFunnel} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" stroke="#666" />
            <YAxis dataKey="stage" type="category" stroke="#666" width={120} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '2px solid #000' }}
              formatter={(value: any, name: string) => {
                if (name === 'users') return [`${value} người dùng`, 'Số lượng']
                return [`${value}%`, 'Tỷ lệ chuyển đổi']
              }}
            />
            <Legend />
            <Bar dataKey="users" fill="#000" name="Số lượng người dùng" />
            <Bar dataKey="conversion" fill="#4B5563" name="Tỷ lệ chuyển đổi (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Features */}
      <div className="border-2 border-black rounded-lg p-6">
        <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Tính Năng Phổ Biến
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.topFeatures}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="feature" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '2px solid #000' }}
            />
            <Bar dataKey="usage" fill="#000" radius={[4, 4, 0, 0]} name="Lượt sử dụng" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
