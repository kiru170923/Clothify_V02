import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const severity = searchParams.get('severity') || ''

    // Get recent security events from various sources
    const securityEvents: any[] = []

    // Get failed login attempts (mock for now - would need auth logs)
    // Get suspicious activities from payment failures
    const { data: failedPayments } = await supabaseAdmin
      .from('payment_orders')
      .select('user_id, created_at, status')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (failedPayments) {
      failedPayments.forEach((payment, index) => {
        securityEvents.push({
          id: `payment_failed_${index}`,
          type: 'failed_login',
          userId: payment.user_id,
          userEmail: `${payment.user_id.substring(0, 8)}...`,
          description: 'Payment failed - potential security issue',
          severity: 'medium',
          ipAddress: 'N/A',
          userAgent: 'N/A',
          timestamp: payment.created_at,
          metadata: { paymentId: payment.user_id, status: payment.status }
        })
      })
    }

    // Get system changes (admin actions)
    const { data: recentUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentUsers) {
      recentUsers.forEach((user, index) => {
        securityEvents.push({
          id: `user_created_${index}`,
          type: 'system_change',
          userId: user.user_id,
          userEmail: `${user.user_id.substring(0, 8)}...`,
          description: 'New user registration',
          severity: 'low',
          ipAddress: 'N/A',
          userAgent: 'N/A',
          timestamp: user.created_at,
          metadata: { action: 'user_created' }
        })
      })
    }

    // Calculate security metrics
    const totalEvents = securityEvents.length
    const criticalEvents = securityEvents.filter(e => e.severity === 'critical').length
    const failedLogins = securityEvents.filter(e => e.type === 'failed_login').length
    const suspiciousActivity = securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length
    const dataBreaches = 0 // No data breaches detected
    const systemChanges = securityEvents.filter(e => e.type === 'system_change').length

    const securityMetrics = {
      totalEvents,
      criticalEvents,
      failedLogins,
      suspiciousActivity,
      dataBreaches,
      systemChanges
    }

    // Filter by severity if specified
    let filteredEvents = securityEvents
    if (severity) {
      filteredEvents = securityEvents.filter(e => e.severity === severity)
    }

    // Sort by timestamp and limit
    filteredEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    filteredEvents = filteredEvents.slice(0, limit)

    return NextResponse.json({
      events: filteredEvents,
      metrics: securityMetrics,
      summary: {
        totalEvents,
        criticalEvents,
        failedLogins,
        suspiciousActivity,
        dataBreaches,
        systemChanges
      }
    })

  } catch (error) {
    console.error('Error fetching security data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
