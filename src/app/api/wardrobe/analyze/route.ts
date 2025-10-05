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

    const prompt = `Bạn là chuyên gia phân tích thời trang. Phân tích ảnh tủ đồ và trả về JSON THUẦN theo schema:

{
  "items": [
    {
      "name": string, // Tên mô tả chi tiết item
      "category": string, // áo thun, sơ mi, quần jeans, áo khoác, váy, quần short...
      "subcategory": string, // polo, dress shirt, skinny jeans, bomber jacket...
      "colors": string[], // ["đen", "trắng", "xanh navy"]
      "materials": string[], // ["cotton", "denim", "polyester"]
      "patterns": string[], // ["solid", "striped", "printed", "plain"]
      "fit": string, // slim, regular, loose, oversized
      "style_tags": string[], // ["casual", "formal", "sporty", "vintage", "modern"]
      "occasion_tags": string[], // ["đi làm", "đi chơi", "dã ngoại", "tiệc tùng"]
      "season_tags": string[], // ["hè", "đông", "thu", "xuân", "quanh năm"]
      "brand": string, // Tên thương hiệu nếu nhìn thấy
      "size_estimate": string, // S, M, L, XL hoặc ước tính
      "condition": string, // "mới", "đã qua sử dụng", "cũ"
      "confidence": number // 0-1 độ tin cậy phân tích
    }
  ],
  "wardrobe_analysis": {
    "total_items": number,
    "style_diversity": string, // "đa dạng", "hạn chế", "chuyên biệt"
    "color_palette": string[], // ["đen", "trắng", "xanh"]
    "missing_categories": string[], // ["áo khoác", "giày"]
    "strengths": string[], // ["nhiều áo thun", "phong cách casual"]
    "recommendations": string[] // ["cần thêm áo khoác", "bổ sung màu sắc"]
  },
  "notes": string // Nhận xét tổng quan về tủ đồ
}

Chỉ trả JSON hợp lệ, không kèm text khác.`

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 1500,
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

    // Save analysis results to user_wardrobe_items if user is authenticated
    try {
      const authHeader = request.headers.get('authorization') || ''
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length)
        const { data: userRes, error: authErr } = await supabaseAdmin.auth.getUser(token)
        const user = userRes?.user
        if (!authErr && user && data.items && Array.isArray(data.items)) {
          // Save each analyzed item to wardrobe
          for (const item of data.items) {
            if (item.confidence > 0.7) { // Only save high-confidence items
              await supabaseAdmin.from('user_wardrobe_items').insert({
                user_id: user.id,
                title: item.name,
                category: item.category,
                subcategory: item.subcategory,
                color: item.colors?.[0] || 'unknown',
                colors: item.colors || [],
                materials: item.materials || [],
                patterns: item.patterns || [],
                fit_type: item.fit,
                style_tags: item.style_tags || [],
                occasion_tags: item.occasion_tags || [],
                season_tags: item.season_tags || [],
                brand: item.brand || null,
                size_estimate: item.size_estimate || null,
                condition: item.condition || 'unknown',
                ai_notes: `${data.notes || ''} | Confidence: ${Math.round(item.confidence * 100)}%`,
                confidence_score: item.confidence,
                analysis_source: 'image_analysis'
              })
            }
          }
          
          // Save wardrobe analysis summary
          if (data.wardrobe_analysis) {
            await supabaseAdmin.from('wardrobe_analysis_summary').upsert({
              user_id: user.id,
              total_items: data.wardrobe_analysis.total_items,
              style_diversity: data.wardrobe_analysis.style_diversity,
              color_palette: data.wardrobe_analysis.color_palette,
              missing_categories: data.wardrobe_analysis.missing_categories,
              strengths: data.wardrobe_analysis.strengths,
              recommendations: data.wardrobe_analysis.recommendations,
              analysis_notes: data.notes,
              last_analyzed: new Date().toISOString()
            }, { onConflict: 'user_id' })
          }
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


