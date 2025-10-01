import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { classifyIntent } from '../../../../lib/nlu'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const VECTOR_MATCH_COUNT = 8
const MAX_PRODUCT_CARDS = 3

// Lightweight helpers to improve matching quality
const normalizeVi = (str: string) => {
  try {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  } catch {
    return String(str || '').toLowerCase()
  }
}

const extractGarmentKeywords = (text: string): string[] => {
  const t = normalizeVi(text)
  const kws: string[] = []
  const add = (k: string) => { if (!kws.includes(k)) kws.push(k) }
  if (/ao\s*khoac|\bkhoac\b|jacket|windbreaker|gio\b|puffer|phao/.test(t)) add('khoac')
  if (/hoodie|sweater|\blen\b/.test(t)) add('hoodie')
  if (/so\s*mi|\bsomi\b/.test(t)) add('so mi')
  if (/\bpolo\b/.test(t)) add('polo')
  if (/ao\s*thun|\btee\b|tshirt/.test(t)) add('thun')
  return kws
}

const keywordMatchesTitle = (title: string, keywords: string[]) => {
  const t = normalizeVi(title)
  return keywords.some((k) => t.includes(k))
}

const SYSTEM_PROMPT = `B?n l� stylist cao c?p v� chuy�n gia d?ch v? c?a Clothify.

TH�NG TIN QUAN TR?NG:
- Clothify hi?n t?i CH? C� TRANG PH?C NAM
- T?t c? s?n ph?m trong h? th?ng d?u d�nh cho nam gi?i
- Khi tu v?n, lu�n nh?c nh? r?ng d�y l� trang ph?c nam
- N?u kh�ch h�ng h?i v? trang ph?c n?, th�ng b�o r?ng Clothify hi?n ch? c� trang ph?c nam

Nguy�n t?c QUAN TR?NG:
Lu�n n�i ti?ng Vi?t c� d?u, t? nhi�n, th�n thi?n.
Ch? g?i � s?n ph?m khi user y�u c?u c? th? (t�m ki?m, mua, gi?i thi?u, c?n mua).
Kh�ng t? d?ng dua s?n ph?m khi ch? l� ch�o h?i, h?i th�ng tin chung, ho?c tu v?n phong c�ch.
Khi th�ng tin chua r� (ng�n s�ch, d?p m?c, phong c�ch, m�u s?c, form d�ng), b?t bu?c h?i l?i tru?c khi dua d? xu?t.
Ch? dua s?n ph?m n?u th�ng tin c� trong ng? c?nh s?n ph?m; n?u thi?u th� n�i r� dang ki?m tra th�m.
M?i s?n ph?m c?n l� gi?i l� do ph� h?p (ch?t li?u, form, d?p, c�ng nang) v� k�m link + gi� tham kh?o.
G?i � t?i da 3 s?n ph?m m?i l?n, ch� � s? d?ng match_with d? d? xu?t ph?i d?.
Tuy?t d?i kh�ng t? b?a th�ng tin t?n kho hay khuy?n m�i khi kh�ng c� d? li?u x�c th?c.
Khi ph� h?p, nh? nh?c ngu?i d�ng v? c�c d?ch v? Clothify (th? d? ?o v?i n�t "Th? ngay", d?t l?ch tu v?n, qu?n l� t? d? s?, c?p nh?t s? do).
K?t th�c b?ng c�u h?i m? d? ti?p t?c h?i tho?i.

C?u tr�c tr? l?i:
Tu v?n phong c�ch � Ph�n t�ch nhu c?u v� dua ra hu?ng gi?i quy?t c? th? cho nam gi?i.
G?i � s?n ph?m � Ch? khi user y�u c?u c? th?, li?t k� t?i da 3 s?n ph?m nam t? ng? c?nh.
D?ch v? Clothify � G?i � h�nh d?ng (th? d? ?o, d?t l?ch, c?p nh?t th�ng tin, g?i � t? d?) d? ti?p t?c h? tr?.`
const SYSTEM_PROMPT_ONE_AT_A_TIME = `B?n l� stylist cao c?p v� chuy�n gia d?ch v? c?a Clothify.

TH�NG TIN QUAN TR?NG:
- Clothify hi?n t?i CH? C� TRANG PH?C NAM
- T?t c? s?n ph?m trong h? th?ng d?u d�nh cho nam gi?i
- N?u kh�ch h�ng h?i v? trang ph?c n?, th�ng b�o r?ng Clothify hi?n ch? c� trang ph?c nam

Nguy�n t?c QUAN TR?NG:
- Lu�n n�i ti?ng Vi?t c� d?u, t? nhi�n, th�n thi?n.
- CH? g?i � s?n ph?m khi user y�u c?u c? th? (t�m ki?m, mua, gi?i thi?u, c?n mua).
- KH�NG t? d?ng dua s?n ph?m khi ch? l� ch�o h?i, h?i th�ng tin chung ho?c tu v?n phong c�ch.
- Khi th�ng tin chua r� (ng�n s�ch, d?p m?c, phong c�ch, m�u s?c, form d�ng), h�y h?i l?i nhung THEO T?NG C�U (one-at-a-time):
  � M?i lu?t h?i T?I �A 1 c�u ng?n.
  � Uu ti�n th? t?: d?p ? th?i ti?t/m�a ? phong c�ch.
  � K�m 3�5 l?a ch?n ng?n trong ngo?c vu�ng, ph�n t�ch b?ng d?u �|�, v� d?: [di ph? | cafe | du l?ch].
  � Tr�nh h?i d?n d?p nhi?u c�u trong m?t lu?t.
- Ch? dua s?n ph?m n?u c� th�ng tin ph� h?p; n?u thi?u d? li?u, n�i r� dang ki?m tra th�m.
- M?i s?n ph?m k�m l� do ph� h?p (ch?t li?u, form, d?p, c�ng nang) + link + gi� tham kh?o.
- G?i � t?i da 3 s?n ph?m/l?n, ch� � d�ng match_with d? d? xu?t ph?i d?.
- Tuy?t d?i kh�ng b?a t?n kho/khuy?n m�i khi kh�ng c� d? li?u x�c th?c.
- Khi ph� h?p, nh? nh�ng g?i � d?ch v? Clothify (th? d? �o �Th? ngay�, d?t l?ch, qu?n l� t? d? s?, c?p nh?t s? do).
- K?t th�c b?ng c�u h?i m? d? ti?p t?c.

C?u tr�c tr? l?i:
- Tu v?n phong c�ch: ph�n t�ch nhu c?u v� dua hu?ng gi?i quy?t c? th? cho nam gi?i.
- G?i � s?n ph?m: ch? khi user y�u c?u c? th?, li?t k� t?i da 3 s?n ph?m t? ng? c?nh.
- D?ch v? Clothify: g?i � h�nh d?ng (th? d? �o, d?t l?ch, c?p nh?t th�ng tin, g?i � t? d?) d? ti?p t?c h? tr?.`

const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat('vi-VN').format(value) + '?'
  } catch {
    return `${value}?`
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json({ error: 'Thi?u n?i dung message' }, { status: 400 })
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY chua c?u h�nh' }, { status: 500 })
    }

    // Use fast regex-based intent detection to reduce latency
    const nlu = classifyIntent(message)
    const isProductRequest = nlu.intent === 'search'
    
    console.log('?? API Intent Detection:', { message, intent: nlu.intent, confidence: nlu.confidence, isProductRequest })
    
    let vectorMatches: any[] = []
    let productScores = new Map<number, number>()
    let productChunks = new Map<number, string[]>()
    let products: any[] = []

    // Best-effort: attach user onboarding profile to context if available
    let profileContext = ''
    try {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
        if (!authErr && user) {
          const { data: prof } = await supabaseAdmin
            .from('user_profiles')
            .select('height_cm,weight_kg,size,style_preferences,favorite_colors,occasions')
            .eq('user_id', user.id)
            .maybeSingle()
          if (prof) {
            const h = prof.height_cm ? `${prof.height_cm}cm` : 'unknown'
            const w = prof.weight_kg ? `${prof.weight_kg}kg` : 'unknown'
            const s = prof.size || 'unknown'
            const styles = Array.isArray(prof.style_preferences) && prof.style_preferences.length ? prof.style_preferences.join(', ') : 'unknown'
            profileContext = `USER_PROFILE:\n- Height: ${h}\n- Weight: ${w}\n- Size: ${s}\n- Styles: ${styles}`
          }
        }
      }
    } catch {}

    // Only search for products if user explicitly asks for them
    if (isProductRequest) {
      // 1) Vector search via RPC (with timeout)
      const embeddingResponse = await Promise.race([
        openai.embeddings.create({ model: 'text-embedding-3-small', input: message }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('embed-timeout')), 7000)),
      ])
      const { data: matches, error: vectorError } = await supabaseAdmin.rpc('match_products', {
        query_embedding: embeddingResponse.data[0].embedding,
        match_count: VECTOR_MATCH_COUNT,
      })
      if (vectorError) throw new Error(`Vector search error: ${vectorError.message}`)
      vectorMatches = matches || []

      ;(vectorMatches ?? []).forEach((match: any, index: number) => {
        const boost = 1000 - index * 5
        productScores.set(match.product_id, Math.max(productScores.get(match.product_id) ?? 0, boost))
        productChunks.set(match.product_id, [ ...(productChunks.get(match.product_id) ?? []), match.content ])
      })

      const orderedProductIds = Array.from(productScores.entries()).sort((a, b) => b[1] - a[1]).map(([id]) => id)
      const chosenProductIds = orderedProductIds.slice(0, Math.max(VECTOR_MATCH_COUNT, 1))

      const { data: fetchedProducts, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id,title,price,url,image,gallery,style,occasion,match_with,why_recommend,variants,search_booster,description_text,tags')
        .in('id', chosenProductIds)
      if (productsError) throw new Error(`Fetch products error: ${productsError.message}`)

      products = fetchedProducts || []

      // 2) Hybrid keyword/price filtering to refine or fallback
      const keywords = extractGarmentKeywords(message)
      const maxPrice = typeof nlu.entities?.price === 'number' ? nlu.entities.price : undefined

      if (keywords.length > 0 || typeof maxPrice === 'number') {
        let q = supabaseAdmin
          .from('products')
          .select('id,title,price,url,image,gallery,style,occasion,match_with,why_recommend,variants,search_booster,description_text,tags')
          .limit(VECTOR_MATCH_COUNT)

        if (keywords.length > 0) {
          const ors: string[] = []
          for (const k of keywords) {
            ors.push(`title.ilike.%${k}%`)
            ors.push(`search_booster.ilike.%${k}%`)
            ors.push(`description_text.ilike.%${k}%`)
          }
          if (ors.length) q = q.or(ors.join(','))
        }
        if (typeof maxPrice === 'number') {
          q = q.lte('price', maxPrice)
        }

        const { data: kwProducts, error: kwErr } = await q
        if (!kwErr && Array.isArray(kwProducts)) {
          // Client-side occasion mapping and filtering
          const occRaw = (nlu.entities?.occasion ?? '').toString().toLowerCase()
          const occCandidates: string[] = (() => {
            if (!occRaw) return []
            const norm = occRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            if (/(phuot)/.test(norm)) return ['du lich', 'di choi']
            if (/(di lam|cong so)/.test(norm)) return ['di lam', 'cong so']
            if (/(di choi|dao pho|cafe)/.test(norm)) return ['di choi']
            if (/(di hoc|den truong)/.test(norm)) return ['di hoc']
            return []
          })()

          const filtered = occCandidates.length
            ? (kwProducts as any[]).filter((p) => {
                const arr = Array.isArray(p.occasion) ? p.occasion.map((x: any) => String(x).toLowerCase()) : []
                return occCandidates.some((o) => arr.includes(o))
              })
            : kwProducts

          for (const p of filtered) {
            if (!productScores.has(p.id)) productScores.set(p.id, 600)
          }
          const merged = new Map<number, any>()
          for (const p of [...products, ...(filtered || [])]) merged.set(p.id, p)
          products = Array.from(merged.values())

          // Small boost if title matches garment keyword
          for (const p of products) {
            if (keywordMatchesTitle(p.title || '', keywords)) {
              productScores.set(p.id, (productScores.get(p.id) ?? 0) + 50)
            }
          }
        }
      }

      // Sort by combined score and keep top set
      products.sort((a, b) => (productScores.get(b.id) ?? 0) - (productScores.get(a.id) ?? 0))
      products = products.slice(0, Math.max(VECTOR_MATCH_COUNT, 1))
    }

    const contextSections: string[] = []
    for (const product of products) {
      const chunks = productChunks.get(product.id) ?? []
      const context = chunks.slice(0, 3).join('\n\n')
      contextSections.push(
        `[SP ${product.id}] ${product.title}\nGi�: ${formatCurrency(product.price)}\nStyle: ${product.style?.join(', ') || 'da d?ng'} ; Occasion: ${product.occasion?.join(', ') || 'da d?ng'}\nLink: ${product.url}\n${context}`
      )
    }

    const contextBlock = isProductRequest 
      ? (contextSections.join('\n\n---\n\n') || 'Chua c� s?n ph?m ph� h?p trong co s? d? li?u.')
      : 'Kh�ng t�m ki?m s?n ph?m v� d�y kh�ng ph?i y�u c?u v? s?n ph?m.'

    // Add extracted entities to context (safe and concise)
    const entitiesInfo = Object.keys(nlu.entities || {}).length > 0
      ? `\n\nEntities: ${JSON.stringify(nlu.entities)}`
      : ''
    const priceKnown = typeof (nlu.entities as any)?.price === 'number' ? (nlu.entities as any).price : 'chua ro'
    const sizeKnown = (nlu.entities as any)?.size || 'chua ro'
    const entitiesInfoExtended = `${entitiesInfo}\n\nTHONG TIN HIEN CO:\n- Ngan sach: ${priceKnown}\n- Size: ${sizeKnown}\n\nRULE: Neu thieu ngan sach hoac size, hoi dung 1 cau ngan kem goi y: [<200k | 200-400k | 400-700k | >700k] va [S | M | L | XL].`
    const bodyContext = Array.isArray((body as any).context) ? (body as any).context : []
    const summary = typeof (body as any).summary === 'string' ? (body as any).summary.trim() : ''
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT_ONE_AT_A_TIME },
      { role: 'system', content: 'Neu thieu ngan sach hoac size, hoi dung 1 cau ngan kem goi y: [<200k | 200-400k | 400-700k | >700k] va [S | M | L | XL]. Tranh hoi nhieu cau cung luc.' },
      ...(profileContext ? [{ role: 'system', content: profileContext } as const] : []),
      ...(summary ? [{ role: 'system', content: `Conversation summary: ${summary}` } as const] : []),
      ...bodyContext
        .filter((m: any) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
        .slice(-12),
      {
        role: 'user',
        content: `Kh�ch h�ng h?i: "${message}"

NG? C?NH S?N PH?M:


Intent: ${nlu.intent} (confidence: ${nlu.confidence})
${isProductRequest ? '��y l� y�u c?u v? s?n ph?m - c� th? g?i � s?n ph?m ph� h?p.' : '��y KH�NG ph?i y�u c?u v? s?n ph?m - ch? tu v?n phong c�ch, kh�ng g?i � s?n ph?m.'}

H�y tr? l?i nhu stylist chuy�n nghi?p, c� th? h?i th�m n?u c?n.`
      }
    ]

    // Optional streaming (faster first token)
    const wantStream = request.headers.get('x-stream') === '1'
    if (wantStream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream<Uint8Array>({
        start: async (controller) => {
          try {
            const streamed = await openai.chat.completions.create({
              model: 'gpt-4o-mini-2024-07-18',
              temperature: 0.5,
              messages: chatMessages,
              max_tokens: 250,
              stream: true
            })

            for await (const part of streamed) {
              const token = part.choices?.[0]?.delta?.content
              if (token) controller.enqueue(encoder.encode(token))
            }
            controller.close()
          } catch (e) {
            controller.enqueue(encoder.encode('\n'))
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no'
        }
      })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      temperature: 0.5,
      messages: chatMessages,
      max_tokens: 250
    })

    const answer = completion.choices[0]?.message?.content?.trim() || 'M�nh s? ki?m tra th�m th�ng tin cho b?n nh�!'

    // Only return products if it was a product request
    let productCards: any[] = []
    
    if (isProductRequest && products.length > 0) {
      type ProductRow = NonNullable<typeof products>[number]
      const productMap = new Map<number, ProductRow>()
      products.forEach((row) => productMap.set(row.id, row as ProductRow))

      const orderedProductIds = Array.from(productScores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)

      productCards = orderedProductIds
        .map((id) => productMap.get(id))
        .filter((item): item is ProductRow => Boolean(item))
        .slice(0, MAX_PRODUCT_CARDS)
        .map((product) => ({
          id: product.id,
          title: product.title,
          price: product.price,
          url: product.url,
          image: product.image,
          gallery: product.gallery,
          style: product.style,
          occasion: product.occasion,
          match_with: product.match_with,
          why_recommend: product.why_recommend,
          variants: product.variants
        }))
    }

    return NextResponse.json({
      answer,
      products: productCards
    })
  } catch (error) {
    console.error('[stylist/chat] error', error)
    return NextResponse.json({ error: 'Kh�ng th? tr? l?i y�u c?u l�c n�y' }, { status: 500 })
  }
}
