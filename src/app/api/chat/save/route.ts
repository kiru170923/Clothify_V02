import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { initSentry } from '../../../../lib/sentry'

initSentry()

export async function POST(req: NextRequest) {
  try {
    console.log('ðŸ” Chat save API called')
    
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('âŒ No auth header')
      return NextResponse.json({ success: false, error: 'No auth' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    console.log('ðŸ”‘ Token length:', token.length)
    
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) {
      console.log('âŒ Auth error:', authErr?.message)
      return NextResponse.json({ success: false, error: 'No user' }, { status: 401 })
    }
    
    console.log('âœ… User authenticated:', user.id)

    const body = await req.json()
    const { messages } = body
    if (!messages) {
      console.log('âŒ Missing messages')
      return NextResponse.json({ success: false, error: 'Missing messages' }, { status: 400 })
    }

    console.log('ðŸ’¬ Messages count:', messages.length)

    // Upsert conversation for user
    const conv = {
      user_id: user.id,
      messages,
      last_message_at: new Date().toISOString()
    }

    console.log('ðŸ’¾ Inserting conversation...')
    const { data, error } = await supabaseAdmin.from('conversations').insert(conv).select().single()
    
    if (error) {
      console.log('âŒ Database error:', error.message)
      // If duplicate key error, try to update instead
      if (error.code === '23505') {
        console.log('ðŸ”„ Duplicate key, trying update...')
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('conversations')
          .update({ messages, last_message_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .select()
          .single()
        
        if (updateError) {
          console.log('âŒ Update error:', updateError.message)
          return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
        }
        
        console.log('âœ… Conversation updated successfully')
        return NextResponse.json({ success: true, conversation: updateData })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    console.log('âœ… Conversation saved successfully')
    return NextResponse.json({ success: true, conversation: data })
  } catch (err: any) {
    console.error('âŒ Save conversation error:', err)
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 })
  }
}



