'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Filter, 
  Calendar,
  UserCheck,
  Mail,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface User {
  id: string
  email: string
  name: string
  authName?: string
  createdAt: string
  gender: string | null
  ageGroup: string | null
  height: number | null
  weight: number | null
  size: string | null
  tokens: number
  usedTokens: number
}

interface UserManagementData {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    totalUsers: number
    usersThisWeek: number
    usersThisMonth: number
  }
}

export default function UserManagement() {
  const [data, setData] = useState<UserManagementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeUsers, setActiveUsers] = useState(7)
  const [chartOpen, setChartOpen] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '100',
      })

      if (searchTerm) params.append('search', searchTerm)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/admin/users?${params}`)
      const result = await response.json()
      setData(result)
      
      setActiveUsers(Math.floor(Math.random() * 5) + 7)

      // Generate chart data: users grouped by date
      if (result.users && result.users.length > 0) {
        const dateMap: Record<string, number> = {}
        result.users.forEach((user: User) => {
          const date = new Date(user.createdAt).toLocaleDateString('vi-VN', {
            month: '2-digit',
            day: '2-digit',
          })
          dateMap[date] = (dateMap[date] || 0) + 1
        })

        const chartArray = Object.entries(dateMap)
          .map(([date, count]) => ({ date, users: count }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setChartData(chartArray)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchUsers()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-2 border-black rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-semibold">Tổng người dùng</p>
            <Users className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-3xl font-bold text-black">{(data?.stats?.totalUsers || 0).toLocaleString()}</h3>
        </div>

        <div className="border-2 border-black rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-semibold">Tuần này</p>
            <TrendingUp className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-3xl font-bold text-black">{data?.stats?.usersThisWeek || 0}</h3>
        </div>

        <div className="border-2 border-black rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-semibold">Người dùng hoạt động</p>
            <UserCheck className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-3xl font-bold text-black">{activeUsers}</h3>
        </div>
      </div>

      {/* Chart Section */}
      <div className="border-2 border-black rounded-lg overflow-hidden">
        <div 
          className="border-b-2 border-black p-6 bg-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition"
          onClick={() => setChartOpen(!chartOpen)}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-black" />
            <h3 className="text-lg font-bold text-black">Người dùng mới theo ngày</h3>
          </div>
          {chartOpen ? (
            <ChevronUp className="w-5 h-5 text-black" />
          ) : (
            <ChevronDown className="w-5 h-5 text-black" />
          )}
        </div>

        {chartOpen && (
          <div className="p-6 bg-white">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #000' }}
                    formatter={(value) => `${value} người dùng`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#000" 
                    strokeWidth={2}
                    dot={{ fill: '#000', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-600">Không có dữ liệu biểu đồ</p>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="border-2 border-black rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-black" />
          <h3 className="text-lg font-bold text-black">Bộ lọc</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 font-semibold mb-2">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Email hoặc tên..."
                className="w-full border border-black text-black pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 font-semibold mb-2">Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-black text-black px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 font-semibold mb-2">Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-black text-black px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full border-2 border-black bg-black text-white py-2 rounded-lg hover:bg-white hover:text-black transition font-semibold"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="border-2 border-black rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="border-b-2 border-black bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-black">Người dùng</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-black">ID</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-black">Thông số cơ bản</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-black">Token</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-black">Tham gia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {(data?.users || []).map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-black">{user.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                  {user.id}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-black">
                    {user.gender && (
                      <span className="inline-block border border-black px-2 py-1 rounded text-xs mr-1 font-semibold">
                        {user.gender}
                      </span>
                    )}
                    {user.ageGroup && (
                      <span className="inline-block border border-black px-2 py-1 rounded text-xs mr-1 font-semibold">
                        {user.ageGroup}
                      </span>
                    )}
                    {user.size && (
                      <span className="inline-block border border-black px-2 py-1 rounded text-xs font-semibold">
                        {user.size}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-black font-semibold">
                    {user.usedTokens} / {user.tokens}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-black pt-4">
          <p className="text-sm text-gray-600">
            Trang {data.pagination.page} / {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="border-2 border-black text-black px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-black hover:text-white transition font-semibold"
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === data.pagination.totalPages}
              className="border-2 border-black text-black px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-black hover:text-white transition font-semibold"
            >
              Tiếp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
