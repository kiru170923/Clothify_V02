'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number }>
  revenueChart: Array<{ date: string; revenue: number }>
  activityChart: Array<{ date: string; tryOns: number; chats: number }>
  topFeatures: Array<{ feature: string; usage: number; growth: number }>
  userSegments: Array<{ segment: string; count: number; percentage: number }>
  conversionFunnel: Array<{ stage: string; users: number; conversion: number }>
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userGrowth: [],
    revenueChart: [],
    activityChart: [],
    topFeatures: [],
    userSegments: [],
    conversionFunnel: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Fetch real analytics data from API
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData({
          userGrowth: data.userGrowth || [],
          revenueChart: data.revenueChart || [],
          activityChart: data.activityChart || [],
          topFeatures: data.topFeatures || [],
          userSegments: data.userSegments || [],
          conversionFunnel: data.conversionFunnel || []
        })
      } else {
        console.error('Error fetching analytics:', response.statusText)
        // Fallback to empty data
        setAnalyticsData({
          userGrowth: [],
          revenueChart: [],
          activityChart: [],
          topFeatures: [],
          userSegments: [],
          conversionFunnel: []
        })
      }
      
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600">Phân tích hiệu suất và xu hướng người dùng</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="90d">90 ngày qua</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tăng trưởng người dùng</h3>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-end space-x-2">
            {analyticsData.userGrowth.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-purple-500 rounded-t"
                  style={{ height: `${(item.users / 25) * 200}px` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {formatDate(item.date)}
                </span>
                <span className="text-xs font-medium text-gray-700">
                  {item.users}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Doanh thu theo thời gian</h3>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-end space-x-2">
            {analyticsData.revenueChart.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-green-500 rounded-t"
                  style={{ height: `${(item.revenue / 600000) * 200}px` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {formatDate(item.date)}
                </span>
                <span className="text-xs font-medium text-gray-700">
                  {formatCurrency(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Features & User Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Features */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tính năng phổ biến</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analyticsData.topFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{feature.feature}</span>
                      <span className="text-sm text-gray-500">{feature.usage.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(feature.usage / 1250) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center">
                    {feature.growth > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm ml-1 ${feature.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(feature.growth)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Segments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Phân khúc người dùng</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analyticsData.userSegments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ 
                        backgroundColor: index === 0 ? '#8B5CF6' : index === 1 ? '#10B981' : '#F59E0B' 
                      }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">{segment.segment}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{segment.count}</div>
                    <div className="text-xs text-gray-500">{segment.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Conversion Funnel</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            {analyticsData.conversionFunnel.map((stage, index) => (
              <div key={index} className="flex-1 text-center">
                <div className="mb-2">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-lg font-bold text-purple-600">{stage.users}</span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">{stage.stage}</div>
                <div className="text-xs text-gray-500">{stage.conversion}%</div>
                {index < analyticsData.conversionFunnel.length - 1 && (
                  <div className="flex justify-center mt-2">
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Hoạt động tổng quan</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">1,250</div>
              <div className="text-sm text-gray-500">Total Sessions</div>
              <div className="text-xs text-green-500">+12.5% vs last period</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">18.5m</div>
              <div className="text-sm text-gray-500">Avg Session Duration</div>
              <div className="text-xs text-green-500">+8.2% vs last period</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">3.2</div>
              <div className="text-sm text-gray-500">Pages per Session</div>
              <div className="text-xs text-red-500">-2.1% vs last period</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
