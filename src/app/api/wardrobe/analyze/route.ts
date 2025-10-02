import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Yêu cầu phải là form-data có trường image' }, { status: 400 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    if (!imageFile) return NextResponse.json({ error: 'Thiếu ảnh' }, { status: 400 })
    if (!imageFile.type.startsWith('image/')) return NextResponse.json({ error: 'File không phải ảnh' }, { status: 400 })
    if (imageFile.size === 0) return NextResponse.json({ error: 'Ảnh rỗng' }, { status: 400 })
    if (imageFile.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Ảnh quá lớn (tối đa 20MB)' }, { status: 400 })

    const bytes = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(bytes).toString('base64')
    const mime = imageFile.type

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY chưa cấu hình' }, { status: 500 })
    }

    const prompt = `Bạn là trợ lý phân tích tủ đồ. Trả về JSON THUẦN (không kèm text) theo schema:
{
  "items": [
    {
      "name": string,
      "category": string, // áo thun, sơ mi, quần jeans, khoác...
      "colors": string[],
      "materials": string[],
      "patterns": string[],
      "fit": string, // slim, regular, oversize...
      "style_tags": string[], // classic, smart-casual, sporty...
      "occasion": string[], // đi làm, đi chơi, dã ngoại...
      "season": string[] // hè, đông, thu, xuân
    }
  ],
  "notes": string // nhận xét ngắn gọn
}
Chỉ trả JSON hợp lệ.`

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64Image}` } }
          ] as any
        }
      ]
    })

    const text = resp.choices?.[0]?.message?.content || '{}'
    let data: any
    try { data = JSON.parse(text) } catch { return NextResponse.json({ error: 'AI trả về JSON không hợp lệ' }, { status: 500 }) }

    // Optional: persist to wardrobe_items if user is authenticated
    try {
      const authHeader = request.headers.get('authorization') || ''
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length)
        const { data: userRes, error: authErr } = await supabaseAdmin.auth.getUser(token)
        const user = userRes?.user
        if (!authErr && user) {
          await supabaseAdmin.from('wardrobe_items').insert({
            user_id: user.id,
            analysis: data
          })
        }
      }
    } catch (e) {
      // Non-fatal
      console.warn('[wardrobe/analyze] persist skipped:', e)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[wardrobe/analyze] error', error)
    return NextResponse.json({ error: 'Không thể phân tích ảnh tủ đồ' }, { status: 500 })
  }
}


