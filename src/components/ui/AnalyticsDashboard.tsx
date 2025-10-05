'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChartBarIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  BellIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { useAnalyticsDashboard } from '@/lib/analyticsDashboard'

interface AnalyticsDashboardProps {
  onWidgetClick?: (widgetId: string) => void
  onAlertClick?: (alertId: string) => void
  disabled?: boolean
}

export default function AnalyticsDashboard({ 
  onWidgetClick, 
  onAlertClick,
  disabled = false 
}: AnalyticsDashboardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showAlerts, setShowAlerts] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>({})

  const {
    fetchAnalyticsData,
    getWidgets,
    getAlerts,
    getUnreadAlerts,
    markAlertAsRead,
    dismissAlert,
    startAutoRefresh,
    stopAutoRefresh,
    exportData,
    importData
  } = useAnalyticsDashboard()

  const widgets = getWidgets()
  const alerts = getAlerts()
  const unreadAlerts = getUnreadAlerts()

  useEffect(() => {
    loadData()
    
    // Initialize widget visibility
    const visibility: Record<string, boolean> = {}
    widgets.forEach(widget => {
      visibility[widget.id] = true
    })
    setWidgetVisibility(visibility)
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh(300000) // 5 minutes
    } else {
      stopAutoRefresh()
    }

    return () => {
      stopAutoRefresh()
    }
  }, [autoRefresh, startAutoRefresh, stopAutoRefresh])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await fetchAnalyticsData()
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics-dashboard.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result as string
        if (importData(data)) {
          loadData()
          alert('Import thành công!')
        } else {
          alert('Import thất bại!')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleAlertClick = (alertId: string) => {
    markAlertAsRead(alertId)
    onAlertClick?.(alertId)
  }

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId)
  }

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgetVisibility(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }))
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const renderWidget = (widget: any) => {
    if (!widgetVisibility[widget.id]) return null

    const baseClasses = "bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    
    return (
      <motion.div
        key={widget.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={baseClasses}
        onClick={() => onWidgetClick?.(widget.id)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Widget Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800">{widget.title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleWidgetVisibility(widget.id)
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {widgetVisibility[widget.id] ? (
                <EyeIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <EyeSlashIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <span className="text-xs text-gray-500">
              {widget.lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
          </div>
        </div>

        {/* Widget Content */}
        <div className="space-y-3">
          {widget.type === 'metric' && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(widget.data).map(([key, value]: [string, any]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                  <div className="text-xs text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {widget.type === 'chart' && (
            <div className="space-y-2">
              {Object.entries(widget.data).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {widget.type === 'table' && (
            <div className="space-y-2">
              {Object.entries(widget.data).map(([key, value]: [string, any]) => (
                <div key={key} className="border-b border-gray-100 pb-2">
                  <div className="font-medium text-gray-700 capitalize mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  {typeof value === 'object' ? (
                    <div className="space-y-1 text-sm text-gray-600">
                      {Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                        <div key={subKey} className="flex justify-between">
                          <span className="capitalize">
                            {subKey.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span>
                            {typeof subValue === 'number' 
                              ? subValue.toLocaleString() 
                              : Array.isArray(subValue) 
                                ? subValue.join(', ') 
                                : subValue
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {widget.type === 'gauge' && (
            <div className="space-y-2">
              {Object.entries(widget.data).map(([key, value]: [string, any]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-medium text-gray-800">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </span>
                  </div>
                  {typeof value === 'number' && value <= 1 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600">
              {lastUpdated ? `Cập nhật lần cuối: ${lastUpdated.toLocaleString('vi-VN')}` : 'Chưa có dữ liệu'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alerts Button */}
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <BellIcon className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={disabled || isLoading}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={disabled}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>

          {/* Import Button */}
          <label className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <ArrowUpTrayIcon className="w-5 h-5" />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Alerts Panel */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800">Thông báo</h3>
              <span className="text-sm text-gray-600">
                {alerts.length} thông báo, {unreadAlerts.length} chưa đọc
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Không có thông báo nào
                </p>
              ) : (
                alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border ${getAlertColor(alert.type)} ${
                      alert.isRead ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm mt-1">{alert.message}</p>
                        <p className="text-xs mt-2 opacity-75">
                          {alert.timestamp.toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAlertClick(alert.id)}
                          className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
                        >
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgets.map(renderWidget)}
      </div>

      {widgets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Chưa có widget nào</p>
          <p className="text-sm">Nhấn nút refresh để tải dữ liệu</p>
        </div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-gray-700">Đang tải dữ liệu...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
