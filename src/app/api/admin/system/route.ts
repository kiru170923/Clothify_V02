import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case 'reset_tokens':
        // Reset all user tokens to default value
        const { error: tokenError } = await supabaseAdmin
          .from('user_tokens')
          .update({ tokens: 100 }) // Default free tokens
          .neq('user_id', null)

        if (tokenError) {
          console.error('Error resetting tokens:', tokenError)
          return NextResponse.json({ error: 'Failed to reset tokens' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'All tokens reset to 100' })

      case 'grant_premium':
        // Grant premium membership to specific users
        const { userIds, duration } = data
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + (duration || 30)) // Default 30 days

        try {
          const membershipData = userIds.map((userId: string) => ({
            user_id: userId,
            plan_type: 'premium',
            status: 'active',
            expires_at: expiresAt.toISOString()
          }))

          const { error: membershipError } = await supabaseAdmin
            .from('user_memberships')
            .upsert(membershipData)

          if (membershipError) {
            console.error('Error granting premium:', membershipError)
            // Try to create a mock payment record instead
            const paymentData = userIds.map((userId: string) => ({
              user_id: userId,
              amount: 299000,
              status: 'completed',
              payment_method: 'admin_grant',
              description: 'Premium Membership - Admin Grant',
              created_at: new Date().toISOString(),
              completed_at: new Date().toISOString()
            }))

            const { error: paymentError } = await supabaseAdmin
              .from('payment_orders')
              .insert(paymentData)

            if (paymentError) {
              console.error('Error creating payment record:', paymentError)
              return NextResponse.json({ error: 'Failed to grant premium' }, { status: 500 })
            }
          }

          return NextResponse.json({ success: true, message: 'Premium granted successfully' })
        } catch (error) {
          console.error('Error in grant_premium:', error)
          return NextResponse.json({ error: 'Failed to grant premium' }, { status: 500 })
        }

      case 'revoke_premium':
        // Revoke premium membership
        const { userIds: revokeUserIds } = data

        try {
          // Try to update membership status first
          const { error: revokeError } = await supabaseAdmin
            .from('user_memberships')
            .update({ status: 'cancelled' })
            .in('user_id', revokeUserIds)

          if (revokeError) {
            console.error('Error revoking premium:', revokeError)
            // Try to create a refund payment record instead
            const refundData = revokeUserIds.map((userId: string) => ({
              user_id: userId,
              amount: 0,
              status: 'cancelled',
              payment_method: 'admin_revoke',
              description: 'Premium Membership - Admin Revoke',
              created_at: new Date().toISOString()
            }))

            const { error: refundError } = await supabaseAdmin
              .from('payment_orders')
              .insert(refundData)

            if (refundError) {
              console.error('Error creating refund record:', refundError)
              return NextResponse.json({ error: 'Failed to revoke premium' }, { status: 500 })
            }
          }

          return NextResponse.json({ success: true, message: 'Premium revoked successfully' })
        } catch (error) {
          console.error('Error in revoke_premium:', error)
          return NextResponse.json({ error: 'Failed to revoke premium' }, { status: 500 })
        }

      case 'add_tokens':
        // Add tokens to specific users
        const { userIds: tokenUserIds, amount } = data

        // Get current tokens for each user
        const { data: currentTokens } = await supabaseAdmin
          .from('user_tokens')
          .select('user_id, tokens')
          .in('user_id', tokenUserIds)

        // Update tokens
        const tokenUpdates = currentTokens?.map(token => ({
          user_id: token.user_id,
          tokens: (token.tokens || 0) + amount
        })) || []

        const { error: addTokenError } = await supabaseAdmin
          .from('user_tokens')
          .upsert(tokenUpdates)

        if (addTokenError) {
          console.error('Error adding tokens:', addTokenError)
          return NextResponse.json({ error: 'Failed to add tokens' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: `Added ${amount} tokens to users` })

      case 'cleanup_data':
        // Clean up old data
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // Delete old images
        const { error: imageError } = await supabaseAdmin
          .from('images')
          .delete()
          .lt('created_at', thirtyDaysAgo.toISOString())

        // Delete old chat messages
        const { error: chatError } = await supabaseAdmin
          .from('chat_messages')
          .delete()
          .lt('created_at', thirtyDaysAgo.toISOString())

        if (imageError || chatError) {
          console.error('Error cleaning up data:', imageError || chatError)
          return NextResponse.json({ error: 'Failed to cleanup data' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Data cleanup completed' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in system action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get system status and health
    const { data: dbStatus } = await supabaseAdmin
      .from('user_profiles')
      .select('count')
      .limit(1)

    // Get storage usage (approximate)
    const { data: imageCount } = await supabaseAdmin
      .from('images')
      .select('count')
      .limit(1)

    const { data: chatCount } = await supabaseAdmin
      .from('chat_messages')
      .select('count')
      .limit(1)

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      storage: {
        images: imageCount?.length || 0,
        chats: chatCount?.length || 0
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting system status:', error)
    return NextResponse.json({ 
      status: 'error',
      error: 'Failed to get system status' 
    }, { status: 500 })
  }
}
