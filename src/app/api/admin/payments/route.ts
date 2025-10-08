import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || ''

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('payment_orders')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('payment_orders')
      .select('*', { count: 'exact', head: true })

    // Get paginated results
    const { data: payments, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    // Format payments
    const formattedPayments = (payments || []).map(payment => ({
      id: payment.id,
      userId: payment.user_id,
      userEmail: `${payment.user_id?.substring(0, 8)}...`, // Truncated user ID
      amount: payment.amount || 0,
      status: payment.status || 'pending',
      paymentMethod: payment.payment_method || 'payos',
      createdAt: payment.created_at,
      completedAt: payment.completed_at,
      description: payment.description || 'Premium Membership',
      metadata: payment.metadata
    }))

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in admin payments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
