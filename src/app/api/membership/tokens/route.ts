import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('🔍 User ID:', user.id)

    // Get user tokens
    const { data: userTokens, error: tokensError } = await supabaseAdmin
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokensError && tokensError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user tokens:', tokensError)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    // If no tokens record exists, create one with 5 free tokens
    if (!userTokens) {
      // Check if user is old (created more than 30 days ago) to give bonus tokens
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('created_at')
        .eq('id', user.id)
        .single()

      const isOldUser = userData && new Date(userData.created_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const initialTokens = isOldUser ? 10 : 5 // Give 10 tokens to old users, 5 to new ones

      const { data: newTokens, error: createError } = await supabaseAdmin
        .from('user_tokens')
        .insert({
          user_id: user.id,
          total_tokens: initialTokens,
          used_tokens: 0,
          last_reset_date: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user tokens:', createError)
        return NextResponse.json({ error: 'Failed to create tokens' }, { status: 500 })
      }

      return NextResponse.json({ 
        tokens: newTokens,
        isNewUser: true,
        bonusTokens: isOldUser ? 5 : 0
      })
    }

    return NextResponse.json({ tokens: userTokens })
  } catch (error) {
    console.error('Error in tokens API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { tokensToUse, description, imageId } = await request.json()

    if (!tokensToUse || tokensToUse <= 0) {
      return NextResponse.json({ error: 'Invalid tokens amount' }, { status: 400 })
    }

    // Check if user has enough tokens
    const { data: userTokens, error: tokensError } = await supabaseAdmin
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokensError) {
      console.error('Error fetching user tokens:', tokensError)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    if (!userTokens || userTokens.total_tokens - userTokens.used_tokens < tokensToUse) {
      return NextResponse.json({ 
        error: 'Insufficient tokens',
        availableTokens: userTokens ? userTokens.total_tokens - userTokens.used_tokens : 0
      }, { status: 400 })
    }

    // Update user tokens
    const { error: updateError } = await supabaseAdmin
      .from('user_tokens')
      .update({
        used_tokens: userTokens.used_tokens + tokensToUse,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating user tokens:', updateError)
      return NextResponse.json({ error: 'Failed to update tokens' }, { status: 500 })
    }

    // Record token usage
    const { error: historyError } = await supabaseAdmin
      .from('token_usage_history')
      .insert({
        user_id: user.id,
        tokens_used: tokensToUse,
        usage_type: 'image_generation',
        description: description || 'Image generation',
        related_image_id: imageId
      })

    if (historyError) {
      console.error('Error recording token usage:', historyError)
      // Don't fail the request, just log the error
    }

    // Return updated token info
    const { data: updatedTokens } = await supabaseAdmin
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ 
      success: true, 
      tokens: updatedTokens,
      tokensUsed: tokensToUse
    })
  } catch (error) {
    console.error('Error in tokens usage API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
