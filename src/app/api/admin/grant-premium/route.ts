import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { userId, duration = 30 } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create a payment record to mark user as premium
    const paymentData = {
      user_id: userId,
      amount: 299000,
      status: 'completed',
      payment_method: 'admin_grant',
      description: 'Premium Membership - Admin Grant',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    }

    const { error: paymentError } = await supabaseAdmin
      .from('payment_orders')
      .insert(paymentData)

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      return NextResponse.json({ error: 'Failed to grant premium' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Premium granted successfully',
      paymentId: paymentData.created_at
    })

  } catch (error) {
    console.error('Error in grant premium API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
