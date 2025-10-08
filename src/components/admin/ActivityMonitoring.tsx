'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Calendar,
  Zap
} from 'lucide-react'

interface ActivityLog {
  id: string
  type: 'try_on' | 'chat' | 'wardrobe' | 'payment' | 'login' | 'error'
  userId: string
  userEmail: string
  description: string
  status: 'success' | 'error' | 'pending'
  timestamp: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

interface SystemMetrics {
  activeConnections: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  responseTime: number
  errorRate: number
}

export default function ActivityMonitoring() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    activeConnections: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    responseTime: 0,
    errorRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchActivities()
    fetchSystemMetrics()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchActivities()
        fetchSystemMetrics()
      }, 10000) // Refresh every 10 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchActivities = async () => {
    try {
      // Fetch activities from API endpoint
      const response = await fetch('/api/admin/activity?limit=100')
      
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      } else {
        console.error('Error fetching activities:', response.statusText)
        // Fallback to mock data
        setActivities([
          {
            id: '1',
            type: 'try_on',
            userId: 'user1',
            userEmail: 'user1@example.com',
            description: 'Thử đồ áo sơ mi',
            status: 'success',
            timestamp: new Date().toISOString(),
            metadata: { status: 'completed' }
          },
          {
            id: '2',
            type: 'chat',
            userId: 'user2',
            userEmail: 'user2@example.com',
            description: 'Chat với AI stylist',
            status: 'success',
            timestamp: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: '3',
            type: 'payment',
            userId: 'user3',
            userEmail: 'user3@example.com',
            description: 'Thanh toán 299000 VND - completed',
            status: 'success',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            metadata: { amount: 299000, status: 'completed' }
          }
        ])
      }
      
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemMetrics = async () => {
    try {
      // Mock system metrics - in real app, this would come from monitoring service
      setSystemMetrics({
        activeConnections: Math.floor(Math.random() * 100) + 50,
        cpuUsage: Math.floor(Math.random() * 30) + 20,
        memoryUsage: Math.floor(Math.random() * 40) + 30,
        diskUsage: Math.floor(Math.random() * 20) + 60,
        responseTime: Math.floor(Math.random() * 200) + 100,
        errorRate: Math.random() * 2
      })
    } catch (error) {
      console.error('Error fetching system metrics:', error)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'try_on': return <Activity className="w-4 h-4" />
      case 'chat': return <Users className="w-4 h-4" />
      case 'payment': return <Zap className="w-4 h-4" />
      case 'login': return <CheckCircle className="w-4 h-4" />
      case 'error': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.type === filter
    const matchesSearch = searchTerm === '' || 
      activity.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Connections</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.activeConnections}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.cpuUsage}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.responseTime}ms</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>
              <p className="text-sm text-gray-500">Real-time monitoring of user activities</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={fetchActivities}
                className="flex items-center space-x-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Activities</option>
                <option value="try_on">Try-On</option>
                <option value="chat">Chat</option>
                <option value="payment">Payment</option>
                <option value="login">Login</option>
                <option value="error">Errors</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {getStatusIcon(activity.status)}
                      <span className="ml-1">{activity.status}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{activity.userEmail}</p>
                  {activity.metadata && (
                    <p className="text-xs text-gray-400">
                      {activity.metadata.amount && `Amount: ${activity.metadata.amount} VND`}
                      {activity.metadata.status && `Status: ${activity.metadata.status}`}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-sm text-gray-500">
                  {formatDate(activity.timestamp)}
                </div>
                <div className="flex-shrink-0">
                  <button className="text-purple-600 hover:text-purple-900">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No activities found</p>
          </div>
        )}
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                <span className="text-sm text-gray-500">{systemMetrics.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${systemMetrics.memoryUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Disk Usage</span>
                <span className="text-sm text-gray-500">{systemMetrics.diskUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${systemMetrics.diskUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Error Rate</span>
                <span className="text-sm text-gray-500">{systemMetrics.errorRate.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${systemMetrics.errorRate * 50}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                <span className="text-sm text-gray-500">{systemMetrics.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${systemMetrics.cpuUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
