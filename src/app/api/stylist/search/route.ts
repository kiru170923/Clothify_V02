import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const DEFAULT_LIMIT = 8
const VECTOR_MATCH_COUNT = 20

const sanitizeTerm = (value: string) => value.replace(/[\%_]/g, '').trim()

const removeDiacritics = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const query = typeof body.q === 'string' ? body.q : ''
    const limit = Math.min(Math.max(Number(body.limit) || DEFAULT_LIMIT, 1), 24)

    if (!query.trim()) {
      return NextResponse.json({ error: 'Thiếu tham số q' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY chưa cấu hình' }, { status: 500 })
    }

    const sanitized = sanitizeTerm(query)
    const plain = removeDiacritics(sanitized).toLowerCase()
    const qLower = sanitized.toLowerCase()
    // Parse simple price max from query like "gia 800000"
    const priceMatch = plain.match(/gia\s+(\d{3,})/)
    const priceMax = priceMatch ? parseInt(priceMatch[1], 10) : undefined

    const textSearchPromise = supabaseAdmin
      .from('products')
      .select('id,title,price,url,image,gallery,style,occasion,match_with,why_recommend,tags,variants')
      .or(
        `title.ilike.%${sanitized}%,search_booster.ilike.%${sanitized}%,search_booster.ilike.%${plain}%`
      )
      .limit(20)

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: sanitized
    })

    const vectorPromise = supabaseAdmin.rpc('match_products', {
      query_embedding: embeddingResponse.data[0].embedding,
      match_count: VECTOR_MATCH_COUNT
    })

    const [{ data: textMatches, error: textError }, { data: vectorMatches, error: vectorError }] = await Promise.all([
      textSearchPromise,
      vectorPromise
    ])

    if (textError) {
      throw new Error(`Text search error: ${textError.message}`)
    }
    if (vectorError) {
      throw new Error(`Vector search error: ${vectorError.message}`)
    }

    const scoreMap = new Map<number, number>()

    ;(vectorMatches ?? []).forEach((match, index) => {
      const boost = 1000 - index
      scoreMap.set(match.product_id, Math.max(scoreMap.get(match.product_id) ?? 0, boost))
    })

    ;(textMatches ?? []).forEach((product, index) => {
      const boost = 500 - index * 2
      scoreMap.set(product.id, Math.max(scoreMap.get(product.id) ?? 0, boost))
    })

    if (scoreMap.size === 0) {
      return NextResponse.json({ q: query, result: [] })
    }

    const orderedIds = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.max(limit * 2, 20)) // fetch more then re-rank
      .map(([id]) => id)

    const { data: productRows, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id,title,price,url,image,gallery,style,occasion,match_with,why_recommend,variants')
      .in('id', orderedIds)

    if (productsError) {
      throw new Error(`Fetch products error: ${productsError.message}`)
    }

    const map = new Map<number, any>()
    ;(productRows ?? []).forEach((item) => map.set(item.id, item))

    // Boost office/working context if query mentions it
    const mentionsOffice = /(cong\s*so|di\s*lam|office)/.test(plain)
    if (mentionsOffice) {
      for (const [id, score] of Array.from(scoreMap.entries())) {
        const row = map.get(id)
        if (!row) continue
        const occ: string[] = Array.isArray(row.occasion) ? row.occasion.map((s: string) => String(s).toLowerCase()) : []
        const sty: string[] = Array.isArray(row.style) ? row.style.map((s: string) => String(s).toLowerCase()) : []
        let boost = 0
        if (occ.some((o) => o.includes('di lam') || o.includes('cong so'))) boost += 220
        if (sty.some((s) => s.includes('smart-casual') || s.includes('formal'))) boost += 180
        if (/so\s*mi/i.test(row.title || '')) boost += 100
        if (boost) scoreMap.set(id, score + boost)
      }
    }

    // Re-rank with boosts and optional price filter
    const orderedAfterBoost = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)

    const filtered = orderedAfterBoost
      .map((id) => map.get(id))
      .filter((row) => !!row && (!priceMax || (typeof row.price === 'number' && row.price <= priceMax)))
      .slice(0, limit)

    const result = filtered

    return NextResponse.json({ q: query, result })
  } catch (error) {
    console.error('[stylist/search] error', error)
    return NextResponse.json({ error: 'Không thể tìm kiếm sản phẩm' }, { status: 500 })
  }
}
