import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: 'Thiếu taskId' }, { status: 400 })
    }

    const rawKey = process.env.KIEAI_API_KEY ?? ''
    const apiKey = rawKey.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'Thiếu API key KIE.AI' }, { status: 500 })
    }

    const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store'
    })

    if (!statusResponse.ok) {
      return NextResponse.json({ error: 'Lấy trạng thái thất bại' }, { status: 502 })
    }

    const statusData = await statusResponse.json()

    if (statusData.code !== 200) {
      return NextResponse.json({ state: 'unknown', data: statusData }, { status: 200 })
    }

    const state = statusData.data?.state

    if (state === 'success' || state === 'completed') {
      try {
        // KIE.AI sometimes returns resultJson
        const resultJson = statusData.data.resultJson ? JSON.parse(statusData.data.resultJson) : null
        const resultImageUrl = resultJson?.resultUrls?.[0] || statusData.data.resultImageUrl
        if (!resultImageUrl) {
          return NextResponse.json({ state: 'success', resultImageUrl: null }, { status: 200 })
        }

        // 🔥 SAVE TO HISTORY DATABASE
        try {
          // Get user from auth header if available
          const authHeader = request.headers.get('authorization')
          if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
            
            if (!authError && user) {
              console.log('💾 Saving try-on result to history for user:', user.id)
              
              // Get original request data from task_metadata table
              const { data: taskMetadata } = await supabaseAdmin
                .from('task_metadata')
                .select('*')
                .eq('task_id', taskId)
                .eq('user_id', user.id)
                .maybeSingle()
              
              console.log('📋 Task metadata found:', taskMetadata)
              
              // Save to images table for history
              const { data: savedImage, error: saveError } = await supabaseAdmin
                .from('images')
                .insert({
                  user_id: user.id,
                  task_id: taskId,
                  person_image_url: taskMetadata?.person_image_url || 'N/A',
                  clothing_image_url: taskMetadata?.clothing_image_url || 'N/A', 
                  result_image_url: resultImageUrl,
                  status: 'completed',
                  provider: 'kieai',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select()
                .single()

              if (saveError) {
                console.error('❌ Error saving to history:', saveError)
                console.error('❌ Save error details:', JSON.stringify(saveError, null, 2))
                console.error('❌ Task metadata used:', JSON.stringify(taskMetadata, null, 2))
                console.error('❌ User ID:', user.id)
              } else {
                console.log('✅ Saved to history:', savedImage?.id)
                console.log('✅ Saved image data:', JSON.stringify(savedImage, null, 2))
              }
            }
          }
        } catch (historyError) {
          console.error('❌ History save error:', historyError)
          // Don't fail the main request if history save fails
        }

        return NextResponse.json({ state: 'success', resultImageUrl }, { status: 200 })
      } catch {
        const resultImageUrl = statusData.data.resultImageUrl
        
        // 🔥 SAVE TO HISTORY DATABASE (fallback)
        try {
          const authHeader = request.headers.get('authorization')
          if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
            
            if (!authError && user && resultImageUrl) {
              console.log('💾 Saving try-on result to history (fallback) for user:', user.id)
              
              const { error: fallbackSaveError } = await supabaseAdmin
                .from('images')
                .insert({
                  user_id: user.id,
                  task_id: taskId,
                  result_image_url: resultImageUrl,
                  status: 'completed',
                  provider: 'kieai',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
              
              if (fallbackSaveError) {
                console.error('❌ Fallback save error:', JSON.stringify(fallbackSaveError, null, 2))
              } else {
                console.log('✅ Fallback save successful')
              }
            }
          }
        } catch (historyError) {
          console.error('❌ History save error (fallback):', historyError)
        }
        
        return NextResponse.json({ state: 'success', resultImageUrl }, { status: 200 })
      }
    }

    if (state === 'fail' || state === 'failed' || state === 'error') {
      return NextResponse.json({ state: 'failed', message: statusData.data?.failMsg || 'Tạo ảnh thất bại' }, { status: 200 })
    }

    return NextResponse.json({ state: 'processing' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Lỗi hệ thống' }, { status: 500 })
  }
}
