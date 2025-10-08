import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create a refund record to mark user as no longer premium
    const refundData = {
      user_id: userId,
      amount: 0,
      status: 'cancelled',
      payment_method: 'admin_revoke',
      description: 'Premium Membership - Admin Revoke',
      created_at: new Date().toISOString()
    }

    const { error: refundError } = await supabaseAdmin
      .from('payment_orders')
      .insert(refundData)

    if (refundError) {
      console.error('Error creating refund record:', refundError)
      return NextResponse.json({ error: 'Failed to revoke premium' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Premium revoked successfully',
      refundId: refundData.created_at
    })

  } catch (error) {
    console.error('Error in revoke premium API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
