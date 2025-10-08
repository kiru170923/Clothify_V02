'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  CreditCard,
  Calendar
} from 'lucide-react'

interface User {
  user_id: string
  gender?: string
  age_group?: string
  height_cm?: number
  weight_kg?: number
  size?: string
  style_preferences?: string[]
  favorite_colors?: string[]
  occasions?: string[]
  budget_range?: string
  try_on_photo_url?: string
  created_at: string
  user_memberships?: Array<{
    plan_type: string
    status: string
    created_at: string
    expires_at?: string
  }>
  user_tokens?: Array<{
    tokens: number
  }>
  auth?: {
    users: {
      email: string
      created_at: string
      last_sign_in_at?: string
    }
  }
}

interface UserManagementProps {
  onUserSelect?: (user: User) => void
}

export default function UserManagement({ onUserSelect }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [membershipFilter, setMembershipFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [premiumUsers, setPremiumUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchUsers()
    fetchPremiumUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, membershipFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users?limit=100')
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        console.error('Error fetching users:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPremiumUsers = async () => {
    try {
      const response = await fetch('/api/admin/payments?limit=1000')
      
      if (response.ok) {
        const data = await response.json()
        const paidUsers = new Set<string>(
          data.payments
            ?.filter((p: any) => p.status === 'completed')
            ?.map((p: any) => p.userId) || []
        )
        setPremiumUsers(paidUsers)
      }
    } catch (error) {
      console.error('Error fetching premium users:', error)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.auth?.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Membership filter
    if (membershipFilter !== 'all') {
      if (membershipFilter === 'free') {
        filtered = filtered.filter(user => !premiumUsers.has(user.user_id))
      } else if (membershipFilter === 'premium') {
        filtered = filtered.filter(user => premiumUsers.has(user.user_id))
      }
    }

    setFilteredUsers(filtered)
  }

  const handleUserAction = async (action: string, user: User) => {
    switch (action) {
      case 'view':
        setSelectedUser(user)
        setShowUserDetails(true)
        onUserSelect?.(user)
        break
      case 'edit':
        // TODO: Implement edit user
        console.log('Edit user:', user.user_id)
        break
      case 'delete':
        if (confirm(`Bạn có chắc muốn xóa user ${user.user_id}?`)) {
          await deleteUser(user.user_id)
        }
        break
      case 'grant_premium':
        await grantPremium(user.user_id)
        break
      case 'revoke_premium':
        await revokePremium(user.user_id)
        break
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(users.filter(u => u.user_id !== userId))
        alert('User đã được xóa thành công')
      } else {
        alert('Lỗi khi xóa user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Lỗi khi xóa user')
    }
  }

  const grantPremium = async (userId: string) => {
    try {
      // For now, just update local state to show premium status
      // In production, this would call the API
      setPremiumUsers(prev => new Set([...Array.from(prev), userId]))
      alert('Premium đã được cấp thành công (Demo mode)')
      
      // TODO: Implement real API call when database schema is ready
      // const response = await fetch('/api/admin/grant-premium', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId: userId, duration: 30 })
      // })
    } catch (error) {
      console.error('Error granting premium:', error)
      alert('Lỗi khi cấp premium')
    }
  }

  const revokePremium = async (userId: string) => {
    try {
      // For now, just update local state to remove premium status
      // In production, this would call the API
      setPremiumUsers(prev => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(userId)
        return newSet
      })
      alert('Premium đã được thu hồi thành công (Demo mode)')
      
      // TODO: Implement real API call when database schema is ready
      // const response = await fetch('/api/admin/revoke-premium', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId: userId })
      // })
    } catch (error) {
      console.error('Error revoking premium:', error)
      alert('Lỗi khi thu hồi premium')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getMembershipStatus = (user: User) => {
    // Check if user has completed payments (premium indicator)
    if (premiumUsers.has(user.user_id)) {
      return { type: 'Premium', color: 'bg-purple-100 text-purple-800' }
    }
    
    // Fallback to membership data if available
    const membership = user.user_memberships?.[0]
    if (membership && membership.plan_type === 'premium' && membership.status === 'active') {
      return { type: 'Premium', color: 'bg-purple-100 text-purple-800' }
    }
    
    return { type: 'Free', color: 'bg-gray-100 text-gray-800' }
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
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo email hoặc ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={membershipFilter}
              onChange={(e) => setMembershipFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tất cả membership</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Người dùng ({filteredUsers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const membership = getMembershipStatus(user)
                return (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {user.user_id.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.auth?.users?.email || `User ${user.user_id.substring(0, 8)}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.user_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{user.gender || 'Chưa cập nhật'}</div>
                        <div>{user.age_group || 'Chưa cập nhật'}</div>
                        {user.size && <div>Size: {user.size}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${membership.color}`}>
                        {membership.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.user_tokens?.[0]?.tokens || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUserAction('view', user)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction('edit', user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {membership.type === 'Free' ? (
                          <button
                            onClick={() => handleUserAction('grant_premium', user)}
                            className="text-green-600 hover:text-green-900"
                            title="Cấp Premium"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction('revoke_premium', user)}
                            className="text-red-600 hover:text-red-900"
                            title="Thu hồi Premium"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleUserAction('delete', user)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Chi tiết người dùng</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Thông tin cơ bản</h4>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <div className="font-medium">{selectedUser.auth?.users?.email || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">User ID:</span>
                    <div className="font-medium">{selectedUser.user_id}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Giới tính:</span>
                    <div className="font-medium">{selectedUser.gender || 'Chưa cập nhật'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Độ tuổi:</span>
                    <div className="font-medium">{selectedUser.age_group || 'Chưa cập nhật'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <div className="font-medium">{selectedUser.size || 'Chưa cập nhật'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày tạo:</span>
                    <div className="font-medium">{formatDate(selectedUser.created_at)}</div>
                  </div>
                </div>
              </div>

              {selectedUser.style_preferences && selectedUser.style_preferences.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Phong cách yêu thích</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUser.style_preferences.map((style, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.favorite_colors && selectedUser.favorite_colors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Màu sắc yêu thích</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUser.favorite_colors.map((color, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900">Membership</h4>
                <div className="mt-2">
                  {selectedUser.user_memberships && selectedUser.user_memberships.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.user_memberships.map((membership, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{membership.plan_type}</div>
                            <div className="text-sm text-gray-500">Status: {membership.status}</div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(membership.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">Chưa có membership</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Tokens</h4>
                <div className="mt-2 text-lg font-medium text-purple-600">
                  {selectedUser.user_tokens?.[0]?.tokens || 0} tokens
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
