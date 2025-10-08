'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Lock, 
  Key,
  UserX,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Database,
  Server
} from 'lucide-react'

interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'data_access' | 'system_change'
  userId: string
  userEmail: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  ipAddress: string
  userAgent: string
  timestamp: string
  metadata?: any
}

interface SecurityMetrics {
  totalEvents: number
  criticalEvents: number
  failedLogins: number
  suspiciousActivity: number
  dataBreaches: number
  systemChanges: number
}

export default function SecurityAudit() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    criticalEvents: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    dataBreaches: 0,
    systemChanges: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSecurityEvents()
  }, [])

  const fetchSecurityEvents = async () => {
    try {
      setLoading(true)
      
      // Fetch real security data from API
      const response = await fetch('/api/admin/security?limit=50')
      
      if (response.ok) {
        const data = await response.json()
        setSecurityEvents(data.events || [])
        setSecurityMetrics(data.metrics || {
          totalEvents: 0,
          criticalEvents: 0,
          failedLogins: 0,
          suspiciousActivity: 0,
          dataBreaches: 0,
          systemChanges: 0
        })
      } else {
        console.error('Error fetching security data:', response.statusText)
        // Fallback to empty data
        setSecurityEvents([])
        setSecurityMetrics({
          totalEvents: 0,
          criticalEvents: 0,
          failedLogins: 0,
          suspiciousActivity: 0,
          dataBreaches: 0,
          systemChanges: 0
        })
      }
      
    } catch (error) {
      console.error('Error fetching security events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'login': return <CheckCircle className="w-4 h-4" />
      case 'logout': return <UserX className="w-4 h-4" />
      case 'failed_login': return <Lock className="w-4 h-4" />
      case 'permission_denied': return <Shield className="w-4 h-4" />
      case 'data_access': return <Database className="w-4 h-4" />
      case 'system_change': return <Server className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const filteredEvents = securityEvents.filter(event => {
    const matchesType = filter === 'all' || event.type === filter
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter
    const matchesSearch = searchTerm === '' || 
      event.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ipAddress.includes(searchTerm)
    return matchesType && matchesSeverity && matchesSearch
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
      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                <dd className="text-lg font-medium text-gray-900">{securityMetrics.totalEvents}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Critical Events</dt>
                <dd className="text-lg font-medium text-gray-900">{securityMetrics.criticalEvents}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Failed Logins</dt>
                <dd className="text-lg font-medium text-gray-900">{securityMetrics.failedLogins}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Suspicious Activity</dt>
                <dd className="text-lg font-medium text-gray-900">{securityMetrics.suspiciousActivity}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Database className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Data Breaches</dt>
                <dd className="text-lg font-medium text-gray-900">{securityMetrics.dataBreaches}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Server className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">System Changes</dt>
                <dd className="text-lg font-medium text-gray-900">{securityMetrics.systemChanges}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Security Audit Log</h3>
              <p className="text-sm text-gray-500">Monitor security events and potential threats</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={fetchSecurityEvents}
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
                  placeholder="Search security events..."
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
                <option value="all">All Events</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="failed_login">Failed Login</option>
                <option value="permission_denied">Permission Denied</option>
                <option value="data_access">Data Access</option>
                <option value="system_change">System Change</option>
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredEvents.map((event) => (
            <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {getEventTypeIcon(event.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{event.description}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                      {getSeverityIcon(event.severity)}
                      <span className="ml-1">{event.severity}</span>
                    </span>
                  </div>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    <span>User: {event.userEmail}</span>
                    <span>IP: {event.ipAddress}</span>
                    <span>Type: {event.type}</span>
                  </div>
                  {event.metadata && (
                    <div className="mt-1 text-xs text-gray-400">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <span key={key} className="mr-4">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-sm text-gray-500">
                  {formatDate(event.timestamp)}
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

        {filteredEvents.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No security events found</p>
          </div>
        )}
      </div>

      {/* Security Recommendations */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Security Recommendations</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Enable 2FA for Admin Accounts</h4>
                <p className="text-sm text-gray-500">Add an extra layer of security for administrative access</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Monitor Failed Login Attempts</h4>
                <p className="text-sm text-gray-500">Consider implementing IP blocking after multiple failed attempts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Regular Security Audits</h4>
                <p className="text-sm text-gray-500">Schedule monthly security reviews and penetration testing</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Key className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Update Security Policies</h4>
                <p className="text-sm text-gray-500">Review and update RLS policies and access controls</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
