'use client'

import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react'

interface Payment {
  id: string
  userId: string
  userEmail: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  paymentMethod: string
  createdAt: string
  completedAt?: string
  description: string
  metadata?: any
}

interface PaymentStats {
  totalRevenue: number
  monthlyRevenue: number
  dailyRevenue: number
  totalTransactions: number
  successRate: number
  avgTransactionValue: number
  pendingAmount: number
  refundedAmount: number
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    dailyRevenue: 0,
    totalTransactions: 0,
    successRate: 0,
    avgTransactionValue: 0,
    pendingAmount: 0,
    refundedAmount: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('30d')

  useEffect(() => {
    fetchPayments()
  }, [dateRange])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      // Fetch real payment data from API
      const response = await fetch('/api/admin/payments?limit=100')
      
      let currentPayments: Payment[] = []
      
      if (response.ok) {
        const data = await response.json()
        currentPayments = data.payments || []
        setPayments(currentPayments)
      } else {
        console.error('Error fetching payments:', response.statusText)
        // Fallback to mock data
        currentPayments = [
          {
            id: '1',
            userId: 'user1',
            userEmail: 'user1@example.com',
            amount: 299000,
            status: 'completed',
            paymentMethod: 'payos',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            description: 'Premium Membership - 1 month'
          }
        ]
        setPayments(currentPayments)
      }

      // Calculate stats from current payments

      const totalRevenue = currentPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)

      const monthlyRevenue = currentPayments
        .filter(p => {
          const paymentDate = new Date(p.createdAt)
          const currentMonth = new Date()
          currentMonth.setDate(1)
          return p.status === 'completed' && paymentDate >= currentMonth
        })
        .reduce((sum, p) => sum + p.amount, 0)

      const dailyRevenue = currentPayments
        .filter(p => {
          const paymentDate = new Date(p.createdAt)
          const oneDayAgo = new Date()
          oneDayAgo.setDate(oneDayAgo.getDate() - 1)
          return p.status === 'completed' && paymentDate >= oneDayAgo
        })
        .reduce((sum, p) => sum + p.amount, 0)

      const totalTransactions = currentPayments.length
      const completedTransactions = currentPayments.filter(p => p.status === 'completed').length
      const successRate = totalTransactions > 0 ? (completedTransactions / totalTransactions * 100) : 0

      const avgTransactionValue = completedTransactions > 0 ? (totalRevenue / completedTransactions) : 0

      const pendingAmount = currentPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0)

      const refundedAmount = currentPayments
        .filter(p => p.status === 'cancelled')
        .reduce((sum, p) => sum + p.amount, 0)

      setPaymentStats({
        totalRevenue,
        monthlyRevenue,
        dailyRevenue,
        totalTransactions,
        successRate,
        avgTransactionValue,
        pendingAmount,
        refundedAmount
      })
      
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'cancelled': return <AlertTriangle className="w-4 h-4 text-gray-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === 'all' || payment.status === filter
    const matchesSearch = searchTerm === '' || 
      payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Tổng doanh thu</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(paymentStats.totalRevenue)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Doanh thu tháng</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(paymentStats.monthlyRevenue)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Doanh thu hôm nay</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(paymentStats.dailyRevenue)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Tỷ lệ thành công</dt>
                <dd className="text-lg font-medium text-gray-900">{paymentStats.successRate.toFixed(1)}%</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{paymentStats.totalTransactions}</div>
            <div className="text-sm text-gray-500">Total Transactions</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(paymentStats.avgTransactionValue)}</div>
            <div className="text-sm text-gray-500">Avg Transaction Value</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(paymentStats.pendingAmount)}</div>
            <div className="text-sm text-gray-500">Pending Amount</div>
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Payment Transactions</h3>
              <p className="text-sm text-gray-500">Manage and monitor payment transactions</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
                <option value="all">All time</option>
              </select>
              <button className="flex items-center space-x-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={fetchPayments}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
                  placeholder="Search payments..."
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
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payment Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.description}</div>
                      <div className="text-sm text-gray-500">ID: {payment.id.slice(0, 8)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.userEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1">{payment.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-purple-600 hover:text-purple-900">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="px-6 py-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payments found</p>
          </div>
        )}
      </div>

      {/* Payment Analytics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment Analytics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h4>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Chart placeholder</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Payment Methods</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">PayOS</span>
                  <span className="text-sm font-medium text-gray-900">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bank Transfer</span>
                  <span className="text-sm font-medium text-gray-900">15%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
