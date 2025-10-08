'use client'

import { useState } from 'react'
import { 
  Settings, 
  RefreshCw, 
  Database, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  UserCheck,
  CreditCard
} from 'lucide-react'

export default function SystemSettings() {
  const [loading, setLoading] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState<any>(null)

  const handleSystemAction = async (action: string) => {
    try {
      setLoading(action)
      
      const response = await fetch('/api/admin/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          data: {}
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(result.message || 'Thao tác thành công')
      } else {
        alert(result.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error performing system action:', error)
      alert('Có lỗi xảy ra')
    } finally {
      setLoading(null)
    }
  }

  const fetchSystemStatus = async () => {
    try {
      setLoading('status')
      const response = await fetch('/api/admin/system')
      const status = await response.json()
      setSystemStatus(status)
    } catch (error) {
      console.error('Error fetching system status:', error)
    } finally {
      setLoading(null)
    }
  }

  const systemActions = [
    {
      id: 'reset_tokens',
      title: 'Reset Tokens',
      description: 'Reset tất cả tokens của người dùng về 100',
      icon: RefreshCw,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      confirmMessage: 'Bạn có chắc muốn reset tất cả tokens về 100?'
    },
    {
      id: 'cleanup_data',
      title: 'Dọn dẹp dữ liệu',
      description: 'Xóa dữ liệu cũ hơn 30 ngày (ảnh, chat)',
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      confirmMessage: 'Bạn có chắc muốn xóa dữ liệu cũ?'
    }
  ]

  const maintenanceActions = [
    {
      id: 'enable_maintenance',
      title: 'Bật chế độ bảo trì',
      description: 'Tạm dừng dịch vụ để bảo trì hệ thống',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      confirmMessage: 'Bạn có chắc muốn bật chế độ bảo trì?'
    },
    {
      id: 'disable_maintenance',
      title: 'Tắt chế độ bảo trì',
      description: 'Khôi phục dịch vụ bình thường',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      confirmMessage: 'Bạn có chắc muốn tắt chế độ bảo trì?'
    }
  ]

  const handleAction = async (action: any) => {
    if (confirm(action.confirmMessage)) {
      await handleSystemAction(action.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Trạng thái hệ thống</h3>
            <button
              onClick={fetchSystemStatus}
              disabled={loading === 'status'}
              className="flex items-center space-x-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading === 'status' ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          {systemStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${systemStatus.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">Status: {systemStatus.status}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Database: {systemStatus.database}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Uptime: {Math.floor(systemStatus.uptime / 3600)}h</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Nhấn Refresh để kiểm tra trạng thái hệ thống</div>
          )}
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Thao tác hệ thống</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemActions.map((action) => {
              const Icon = action.icon
              return (
                <div key={action.id} className={`${action.bgColor} rounded-lg p-4`}>
                  <div className="flex items-start space-x-3">
                    <Icon className={`w-6 h-6 ${action.color} flex-shrink-0 mt-1`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{action.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      <button
                        onClick={() => handleAction(action)}
                        disabled={loading === action.id}
                        className={`mt-3 px-4 py-2 text-white text-sm rounded-lg transition-colors disabled:opacity-50 ${action.buttonColor}`}
                      >
                        {loading === action.id ? (
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Đang xử lý...</span>
                          </div>
                        ) : (
                          action.title
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Chế độ bảo trì</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {maintenanceActions.map((action) => {
              const Icon = action.icon
              return (
                <div key={action.id} className={`${action.bgColor} rounded-lg p-4`}>
                  <div className="flex items-start space-x-3">
                    <Icon className={`w-6 h-6 ${action.color} flex-shrink-0 mt-1`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{action.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      <button
                        onClick={() => handleAction(action)}
                        disabled={loading === action.id}
                        className={`mt-3 px-4 py-2 text-white text-sm rounded-lg transition-colors disabled:opacity-50 ${action.buttonColor}`}
                      >
                        {loading === action.id ? (
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Đang xử lý...</span>
                          </div>
                        ) : (
                          action.title
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Backup & Recovery */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Backup & Recovery</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Database className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">Tạo Backup</h4>
                  <p className="text-sm text-gray-600 mt-1">Tạo backup toàn bộ dữ liệu hệ thống</p>
                  <button
                    onClick={() => handleSystemAction('backup')}
                    disabled={loading === 'backup'}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading === 'backup' ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang tạo...</span>
                      </div>
                    ) : (
                      'Tạo Backup'
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">Khôi phục dữ liệu</h4>
                  <p className="text-sm text-gray-600 mt-1">Khôi phục từ backup gần nhất</p>
                  <button
                    onClick={() => handleSystemAction('restore')}
                    disabled={loading === 'restore'}
                    className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading === 'restore' ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang khôi phục...</span>
                      </div>
                    ) : (
                      'Khôi phục'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Bảo mật</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Xác thực 2 lớp</h4>
                <p className="text-sm text-gray-500">Yêu cầu xác thực 2 lớp cho admin</p>
              </div>
              <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">
                Bật
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Log hoạt động</h4>
                <p className="text-sm text-gray-500">Ghi log tất cả hoạt động admin</p>
              </div>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
                Đã bật
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Giới hạn IP</h4>
                <p className="text-sm text-gray-500">Chỉ cho phép truy cập từ IP được phép</p>
              </div>
              <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">
                Cấu hình
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
