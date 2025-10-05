'use client'

export interface AnalyticsData {
  userStats: {
    totalUsers: number
    activeUsers: number
    newUsers: number
    retentionRate: number
  }
  usageStats: {
    totalSessions: number
    averageSessionDuration: number
    totalMessages: number
    averageMessagesPerSession: number
  }
  featureStats: {
    virtualTryOn: {
      totalUses: number
      successRate: number
      averageRating: number
    }
    styleQuiz: {
      totalCompletions: number
      averageScore: number
      completionRate: number
    }
    wardrobeManager: {
      totalItems: number
      totalOutfits: number
      averageItemsPerUser: number
    }
    voiceCommands: {
      totalCommands: number
      successRate: number
      popularCommands: string[]
    }
  }
  conversationStats: {
    totalConversations: number
    averageConversationLength: number
    popularIntents: Array<{
      intent: string
      count: number
      percentage: number
    }>
    satisfactionRate: number
  }
  performanceStats: {
    averageResponseTime: number
    errorRate: number
    uptime: number
    apiCalls: number
  }
  trends: {
    dailyActiveUsers: Array<{
      date: string
      count: number
    }>
    weeklyMessages: Array<{
      week: string
      count: number
    }>
    monthlyFeatures: Array<{
      month: string
      virtualTryOn: number
      styleQuiz: number
      wardrobeManager: number
    }>
  }
}

export interface DashboardWidget {
  id: string
  title: string
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'progress'
  data: any
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number; w: number; h: number }
  refreshInterval?: number
  lastUpdated: Date
}

export interface Alert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  action?: {
    type: string
    data: any
  }
}

export class AnalyticsDashboard {
  private data: AnalyticsData | null = null
  private widgets: Map<string, DashboardWidget> = new Map()
  private alerts: Alert[] = []
  private refreshInterval: NodeJS.Timeout | null = null
  private storageKey = 'analytics_dashboard'

  constructor() {
    this.initializeWidgets()
    this.loadFromStorage()
  }

  private initializeWidgets(): void {
    // User Stats Widget
    this.widgets.set('user_stats', {
      id: 'user_stats',
      title: 'Thống kê người dùng',
      type: 'metric',
      data: {
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        retentionRate: 0
      },
      size: 'medium',
      position: { x: 0, y: 0, w: 3, h: 2 },
      refreshInterval: 300000, // 5 minutes
      lastUpdated: new Date()
    })

    // Usage Stats Widget
    this.widgets.set('usage_stats', {
      id: 'usage_stats',
      title: 'Thống kê sử dụng',
      type: 'chart',
      data: {
        totalSessions: 0,
        averageSessionDuration: 0,
        totalMessages: 0,
        averageMessagesPerSession: 0
      },
      size: 'large',
      position: { x: 3, y: 0, w: 4, h: 2 },
      refreshInterval: 300000,
      lastUpdated: new Date()
    })

    // Feature Stats Widget
    this.widgets.set('feature_stats', {
      id: 'feature_stats',
      title: 'Thống kê tính năng',
      type: 'table',
      data: {
        virtualTryOn: { totalUses: 0, successRate: 0, averageRating: 0 },
        styleQuiz: { totalCompletions: 0, averageScore: 0, completionRate: 0 },
        wardrobeManager: { totalItems: 0, totalOutfits: 0, averageItemsPerUser: 0 },
        voiceCommands: { totalCommands: 0, successRate: 0, popularCommands: [] }
      },
      size: 'large',
      position: { x: 0, y: 2, w: 4, h: 3 },
      refreshInterval: 600000, // 10 minutes
      lastUpdated: new Date()
    })

    // Conversation Stats Widget
    this.widgets.set('conversation_stats', {
      id: 'conversation_stats',
      title: 'Thống kê hội thoại',
      type: 'chart',
      data: {
        totalConversations: 0,
        averageConversationLength: 0,
        popularIntents: [],
        satisfactionRate: 0
      },
      size: 'medium',
      position: { x: 4, y: 2, w: 3, h: 3 },
      refreshInterval: 300000,
      lastUpdated: new Date()
    })

    // Performance Stats Widget
    this.widgets.set('performance_stats', {
      id: 'performance_stats',
      title: 'Hiệu suất hệ thống',
      type: 'gauge',
      data: {
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 0,
        apiCalls: 0
      },
      size: 'small',
      position: { x: 7, y: 2, w: 2, h: 2 },
      refreshInterval: 60000, // 1 minute
      lastUpdated: new Date()
    })

    // Trends Widget
    this.widgets.set('trends', {
      id: 'trends',
      title: 'Xu hướng sử dụng',
      type: 'chart',
      data: {
        dailyActiveUsers: [],
        weeklyMessages: [],
        monthlyFeatures: []
      },
      size: 'large',
      position: { x: 0, y: 5, w: 7, h: 3 },
      refreshInterval: 3600000, // 1 hour
      lastUpdated: new Date()
    })
  }

  public async fetchAnalyticsData(): Promise<AnalyticsData> {
    try {
      // In a real implementation, this would fetch from your analytics API
      // For now, we'll generate mock data
      const mockData: AnalyticsData = {
        userStats: {
          totalUsers: Math.floor(Math.random() * 1000) + 500,
          activeUsers: Math.floor(Math.random() * 200) + 100,
          newUsers: Math.floor(Math.random() * 50) + 10,
          retentionRate: Math.random() * 0.3 + 0.7
        },
        usageStats: {
          totalSessions: Math.floor(Math.random() * 5000) + 1000,
          averageSessionDuration: Math.random() * 10 + 5,
          totalMessages: Math.floor(Math.random() * 50000) + 10000,
          averageMessagesPerSession: Math.random() * 5 + 3
        },
        featureStats: {
          virtualTryOn: {
            totalUses: Math.floor(Math.random() * 1000) + 200,
            successRate: Math.random() * 0.2 + 0.8,
            averageRating: Math.random() * 1 + 4
          },
          styleQuiz: {
            totalCompletions: Math.floor(Math.random() * 500) + 100,
            averageScore: Math.random() * 20 + 80,
            completionRate: Math.random() * 0.3 + 0.7
          },
          wardrobeManager: {
            totalItems: Math.floor(Math.random() * 2000) + 500,
            totalOutfits: Math.floor(Math.random() * 500) + 100,
            averageItemsPerUser: Math.random() * 10 + 5
          },
          voiceCommands: {
            totalCommands: Math.floor(Math.random() * 300) + 50,
            successRate: Math.random() * 0.2 + 0.8,
            popularCommands: ['search', 'advice', 'try_on', 'quiz']
          }
        },
        conversationStats: {
          totalConversations: Math.floor(Math.random() * 2000) + 500,
          averageConversationLength: Math.random() * 10 + 5,
          popularIntents: [
            { intent: 'search', count: Math.floor(Math.random() * 500) + 100, percentage: 0.4 },
            { intent: 'advice', count: Math.floor(Math.random() * 300) + 80, percentage: 0.3 },
            { intent: 'try_on', count: Math.floor(Math.random() * 200) + 50, percentage: 0.2 },
            { intent: 'quiz', count: Math.floor(Math.random() * 100) + 20, percentage: 0.1 }
          ],
          satisfactionRate: Math.random() * 0.2 + 0.8
        },
        performanceStats: {
          averageResponseTime: Math.random() * 2 + 1,
          errorRate: Math.random() * 0.05,
          uptime: Math.random() * 0.05 + 0.95,
          apiCalls: Math.floor(Math.random() * 10000) + 5000
        },
        trends: {
          dailyActiveUsers: this.generateDailyTrend(30),
          weeklyMessages: this.generateWeeklyTrend(12),
          monthlyFeatures: this.generateMonthlyTrend(6)
        }
      }

      this.data = mockData
      this.updateWidgets()
      this.checkAlerts()
      this.saveToStorage()
      
      return mockData
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      throw error
    }
  }

  private generateDailyTrend(days: number): Array<{ date: string; count: number }> {
    const trend = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      trend.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 100) + 50
      })
    }
    
    return trend
  }

  private generateWeeklyTrend(weeks: number): Array<{ week: string; count: number }> {
    const trend = []
    const today = new Date()
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - (i * 7))
      
      trend.push({
        week: `Tuần ${weeks - i}`,
        count: Math.floor(Math.random() * 1000) + 500
      })
    }
    
    return trend
  }

  private generateMonthlyTrend(months: number): Array<{ month: string; virtualTryOn: number; styleQuiz: number; wardrobeManager: number }> {
    const trend = []
    const today = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(today)
      month.setMonth(month.getMonth() - i)
      
      trend.push({
        month: month.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        virtualTryOn: Math.floor(Math.random() * 200) + 50,
        styleQuiz: Math.floor(Math.random() * 100) + 20,
        wardrobeManager: Math.floor(Math.random() * 300) + 100
      })
    }
    
    return trend
  }

  private updateWidgets(): void {
    if (!this.data) return

    // Update user stats widget
    const userStatsWidget = this.widgets.get('user_stats')
    if (userStatsWidget) {
      userStatsWidget.data = this.data.userStats
      userStatsWidget.lastUpdated = new Date()
    }

    // Update usage stats widget
    const usageStatsWidget = this.widgets.get('usage_stats')
    if (usageStatsWidget) {
      usageStatsWidget.data = this.data.usageStats
      usageStatsWidget.lastUpdated = new Date()
    }

    // Update feature stats widget
    const featureStatsWidget = this.widgets.get('feature_stats')
    if (featureStatsWidget) {
      featureStatsWidget.data = this.data.featureStats
      featureStatsWidget.lastUpdated = new Date()
    }

    // Update conversation stats widget
    const conversationStatsWidget = this.widgets.get('conversation_stats')
    if (conversationStatsWidget) {
      conversationStatsWidget.data = this.data.conversationStats
      conversationStatsWidget.lastUpdated = new Date()
    }

    // Update performance stats widget
    const performanceStatsWidget = this.widgets.get('performance_stats')
    if (performanceStatsWidget) {
      performanceStatsWidget.data = this.data.performanceStats
      performanceStatsWidget.lastUpdated = new Date()
    }

    // Update trends widget
    const trendsWidget = this.widgets.get('trends')
    if (trendsWidget) {
      trendsWidget.data = this.data.trends
      trendsWidget.lastUpdated = new Date()
    }
  }

  private checkAlerts(): void {
    if (!this.data) return

    // Check for performance alerts
    if (this.data.performanceStats.errorRate > 0.05) {
      this.addAlert({
        type: 'warning',
        title: 'Tỷ lệ lỗi cao',
        message: `Tỷ lệ lỗi hiện tại: ${(this.data.performanceStats.errorRate * 100).toFixed(2)}%`,
        timestamp: new Date(),
        isRead: false
      })
    }

    if (this.data.performanceStats.averageResponseTime > 3) {
      this.addAlert({
        type: 'warning',
        title: 'Thời gian phản hồi chậm',
        message: `Thời gian phản hồi trung bình: ${this.data.performanceStats.averageResponseTime.toFixed(2)}s`,
        timestamp: new Date(),
        isRead: false
      })
    }

    // Check for usage alerts
    if (this.data.userStats.retentionRate < 0.7) {
      this.addAlert({
        type: 'info',
        title: 'Tỷ lệ giữ chân người dùng thấp',
        message: `Tỷ lệ giữ chân: ${(this.data.userStats.retentionRate * 100).toFixed(2)}%`,
        timestamp: new Date(),
        isRead: false
      })
    }

    // Check for feature usage alerts
    if (this.data.featureStats.virtualTryOn.successRate < 0.8) {
      this.addAlert({
        type: 'warning',
        title: 'Tỷ lệ thành công thử đồ ảo thấp',
        message: `Tỷ lệ thành công: ${(this.data.featureStats.virtualTryOn.successRate * 100).toFixed(2)}%`,
        timestamp: new Date(),
        isRead: false
      })
    }
  }

  public addAlert(alert: Omit<Alert, 'id'>): void {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    this.alerts.unshift(newAlert)
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50)
    }
    
    this.saveToStorage()
  }

  public markAlertAsRead(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.isRead = true
      this.saveToStorage()
    }
  }

  public dismissAlert(alertId: string): void {
    this.alerts = this.alerts.filter(a => a.id !== alertId)
    this.saveToStorage()
  }

  public getAlerts(): Alert[] {
    return [...this.alerts]
  }

  public getUnreadAlerts(): Alert[] {
    return this.alerts.filter(a => !a.isRead)
  }

  public getWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values())
  }

  public getWidget(id: string): DashboardWidget | null {
    return this.widgets.get(id) || null
  }

  public updateWidget(id: string, updates: Partial<DashboardWidget>): boolean {
    const widget = this.widgets.get(id)
    if (!widget) return false

    const updatedWidget = {
      ...widget,
      ...updates,
      lastUpdated: new Date()
    }

    this.widgets.set(id, updatedWidget)
    this.saveToStorage()
    return true
  }

  public reorderWidgets(widgetIds: string[]): void {
    const newWidgets = new Map()
    
    widgetIds.forEach((id, index) => {
      const widget = this.widgets.get(id)
      if (widget) {
        const row = Math.floor(index / 4)
        const col = index % 4
        widget.position = { x: col, y: row, w: widget.position.w, h: widget.position.h }
        newWidgets.set(id, widget)
      }
    })

    this.widgets = newWidgets
    this.saveToStorage()
  }

  public startAutoRefresh(interval: number = 300000): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    this.refreshInterval = setInterval(() => {
      this.fetchAnalyticsData()
    }, interval)
  }

  public stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  public exportData(): string {
    const exportData = {
      data: this.data,
      widgets: Array.from(this.widgets.entries()),
      alerts: this.alerts,
      exportedAt: new Date().toISOString()
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  public importData(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData)
      
      if (importData.data) {
        this.data = importData.data
      }
      
      if (importData.widgets) {
        this.widgets = new Map(importData.widgets)
      }
      
      if (importData.alerts) {
        this.alerts = importData.alerts.map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        }))
      }
      
      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Error importing analytics data:', error)
      return false
    }
  }

  private saveToStorage(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }
    
    try {
      const dataToSave = {
        data: this.data,
        widgets: Array.from(this.widgets.entries()),
        alerts: this.alerts
      }
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Error saving analytics data to storage:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        
        if (data.data) {
          this.data = data.data
        }
        
        if (data.widgets) {
          this.widgets = new Map(data.widgets)
        }
        
        if (data.alerts) {
          this.alerts = data.alerts.map((alert: any) => ({
            ...alert,
            timestamp: new Date(alert.timestamp)
          }))
        }
      }
    } catch (error) {
      console.error('Error loading analytics data from storage:', error)
    }
  }

  public clearData(): void {
    this.data = null
    this.widgets.clear()
    this.alerts = []
    this.stopAutoRefresh()
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.storageKey)
      } catch (error) {
        console.error('Error clearing analytics data:', error)
      }
    }
  }
}

// Singleton instance
export const analyticsDashboard = new AnalyticsDashboard()

// Hook for React components
export const useAnalyticsDashboard = () => {
  return {
    fetchAnalyticsData: () => analyticsDashboard.fetchAnalyticsData(),
    getWidgets: () => analyticsDashboard.getWidgets(),
    getWidget: (id: string) => analyticsDashboard.getWidget(id),
    updateWidget: (id: string, updates: Partial<DashboardWidget>) => 
      analyticsDashboard.updateWidget(id, updates),
    reorderWidgets: (widgetIds: string[]) => analyticsDashboard.reorderWidgets(widgetIds),
    getAlerts: () => analyticsDashboard.getAlerts(),
    getUnreadAlerts: () => analyticsDashboard.getUnreadAlerts(),
    addAlert: (alert: Omit<Alert, 'id'>) => analyticsDashboard.addAlert(alert),
    markAlertAsRead: (alertId: string) => analyticsDashboard.markAlertAsRead(alertId),
    dismissAlert: (alertId: string) => analyticsDashboard.dismissAlert(alertId),
    startAutoRefresh: (interval?: number) => analyticsDashboard.startAutoRefresh(interval),
    stopAutoRefresh: () => analyticsDashboard.stopAutoRefresh(),
    exportData: () => analyticsDashboard.exportData(),
    importData: (jsonData: string) => analyticsDashboard.importData(jsonData),
    clearData: () => analyticsDashboard.clearData()
  }
}
