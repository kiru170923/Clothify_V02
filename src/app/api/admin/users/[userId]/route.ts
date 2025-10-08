import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Get user profile with all related data
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        *,
        user_memberships(plan_type, status, created_at, expires_at),
        user_tokens(tokens),
        auth.users(email, created_at, last_sign_in_at)
      `)
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's wardrobe items
    const { data: wardrobeItems } = await supabaseAdmin
      .from('user_wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    // Get user's try-on history
    const { data: tryOnHistory } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get user's chat history
    const { data: chatHistory } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get user's payment history
    const { data: paymentHistory } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      profile: userProfile,
      wardrobe: wardrobeItems || [],
      tryOnHistory: tryOnHistory || [],
      chatHistory: chatHistory || [],
      paymentHistory: paymentHistory || []
    })

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const updates = await request.json()

    // Update user profile
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ user: data })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
