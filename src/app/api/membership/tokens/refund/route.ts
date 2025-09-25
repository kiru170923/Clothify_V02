import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { tokensToRefund, reason } = await request.json()
    const amount = Number(tokensToRefund)
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 })
    }

    // Fetch current tokens
    const { data: userTokens, error: tokensError } = await supabaseAdmin
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokensError) {
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    // Apply refund: increment total_tokens, decrement used_tokens but not below 0
    const newTotal = (userTokens?.total_tokens || 0) + amount
    const newUsed = Math.max((userTokens?.used_tokens || 0) - amount, 0)

    const { error: updateError } = await supabaseAdmin
      .from('user_tokens')
      .update({
        total_tokens: newTotal,
        used_tokens: newUsed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update tokens' }, { status: 500 })
    }

    // Record refund history
    await supabaseAdmin.from('token_usage_history').insert({
      user_id: user.id,
      tokens_used: -amount,
      usage_type: 'refund',
      description: reason || 'Refund after failed generation'
    })

    const { data: updated } = await supabaseAdmin
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ success: true, tokens: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


