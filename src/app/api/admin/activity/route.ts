import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || 'all'

    let activities: any[] = []

    if (type === 'all' || type === 'try_on') {
      // Get try-on activities - simplified query
      const { data: tryOnData } = await supabaseAdmin
        .from('images')
        .select('id, user_id, created_at, status')
        .order('created_at', { ascending: false })
        .limit(type === 'try_on' ? limit : Math.ceil(limit / 4))

      if (tryOnData) {
        activities.push(...tryOnData.map(item => ({
          id: item.id,
          type: 'try_on',
          userId: item.user_id,
          description: `Thử đồ ảo - ${item.status}`,
          timestamp: item.created_at,
          userEmail: `${item.user_id?.substring(0, 8)}...`,
          status: item.status === 'completed' ? 'success' : 'error',
          metadata: { status: item.status }
        })))
      }
    }

    if (type === 'all' || type === 'chat') {
      // Get chat activities - simplified query
      const { data: chatData } = await supabaseAdmin
        .from('chat_messages')
        .select('id, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(type === 'chat' ? limit : Math.ceil(limit / 4))

      if (chatData) {
        activities.push(...chatData.map(item => ({
          id: item.id,
          type: 'chat',
          userId: item.user_id,
          description: 'Chat với AI stylist',
          timestamp: item.created_at,
          userEmail: `${item.user_id?.substring(0, 8)}...`,
          status: 'success'
        })))
      }
    }

    if (type === 'all' || type === 'wardrobe') {
      // Get wardrobe activities - simplified query
      const { data: wardrobeData } = await supabaseAdmin
        .from('user_wardrobe_items')
        .select('id, user_id, created_at, title')
        .order('created_at', { ascending: false })
        .limit(type === 'wardrobe' ? limit : Math.ceil(limit / 4))

      if (wardrobeData) {
        activities.push(...wardrobeData.map(item => ({
          id: item.id,
          type: 'wardrobe',
          userId: item.user_id,
          description: `Thêm "${item.title}" vào tủ đồ`,
          timestamp: item.created_at,
          userEmail: `${item.user_id?.substring(0, 8)}...`,
          status: 'success'
        })))
      }
    }

    if (type === 'all' || type === 'payment') {
      // Get payment activities - simplified query
      const { data: paymentData } = await supabaseAdmin
        .from('payment_orders')
        .select('id, user_id, created_at, amount, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(type === 'payment' ? limit : Math.ceil(limit / 4))

      if (paymentData) {
        activities.push(...paymentData.map(item => ({
          id: item.id,
          type: 'payment',
          userId: item.user_id,
          description: `Thanh toán ${item.amount || 0} VND`,
          timestamp: item.created_at,
          userEmail: `${item.user_id?.substring(0, 8)}...`,
          status: 'success',
          metadata: { amount: item.amount, status: item.status }
        })))
      }
    }

    // Sort all activities by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    activities = activities.slice(0, limit)

    return NextResponse.json({ activities })

  } catch (error) {
    console.error('Error fetching admin activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
