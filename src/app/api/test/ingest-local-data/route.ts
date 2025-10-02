import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import fs from 'fs/promises'
import path from 'path'

type AnyRecord = Record<string, any>

const readJsonSafe = async (p: string) => {
  try {
    const raw = await fs.readFile(p, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

const toArray = (v: any): string[] => {
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string' && x.trim())
  if (typeof v === 'string' && v.trim()) return [v.trim()]
  return []
}

const pickFirstImage = (images: string[]) => images.find((u) => typeof u === 'string' && /^https?:\/\//.test(u)) || null

const buildSearchBooster = (row: AnyRecord) => {
  const parts: string[] = []
  const push = (v?: any) => {
    if (!v) return
    const s = Array.isArray(v) ? v.join(' ') : String(v)
    if (s && s.trim()) parts.push(s.trim())
  }
  push(row.title)
  push(row.tags)
  push(row.description_text)
  push(row.style)
  push(row.occasion)
  return parts.join(' ').slice(0, 5000)
}

const mapRecordToProduct = (rec: AnyRecord): AnyRecord | null => {
  try {
    const title = rec.title || rec.name || rec?.normalized?.title || rec?.metadata?.title
    const price = rec.price ?? rec?.normalized?.price
    const url = rec.url || rec.productUrl || rec.source_url
    const gallery = toArray(rec.gallery || rec?.normalized?.images || rec?.metadata?.images)
    const image = rec.image || pickFirstImage(gallery)
    const style = toArray(rec.style || rec?.normalized?.style)
    const occasion = toArray(rec.occasion || rec?.normalized?.occasion)
    const match_with = toArray(rec.match_with || rec?.normalized?.match_with)
    const why_recommend = rec.why_recommend || rec?.normalized?.why_recommend || rec.description || rec?.normalized?.description
    const description_text = rec.description_text || rec?.normalized?.description || ''
    const tags = toArray(rec.tags)
    const variants = Array.isArray(rec.variants) ? rec.variants : null

    if (!title || !url || !(typeof price === 'number')) return null

    const row: AnyRecord = {
      title: String(title),
      price: Number(price),
      url: String(url),
      image: typeof image === 'string' ? image : null,
      gallery,
      style,
      occasion,
      match_with,
      why_recommend: why_recommend ? String(why_recommend) : null,
      variants,
      description_text,
      tags,
    }
    row.search_booster = buildSearchBooster(row)
    return row
  } catch {
    return null
  }
}

export async function POST(_req: NextRequest) {
  try {
    // Server is started inside Clothify_V02, so data lives at ./data/*.json
    const topPath = path.join(process.cwd(), 'data', 'top.json')
    const bottomPath = path.join(process.cwd(), 'data', 'bottom.json')

    const [top, bottom] = await Promise.all([readJsonSafe(topPath), readJsonSafe(bottomPath)])
    if (!top && !bottom) return NextResponse.json({ success: false, error: 'No data files found' }, { status: 400 })

    const raw: AnyRecord[] = []
    if (Array.isArray(top)) raw.push(...top)
    if (Array.isArray(bottom)) raw.push(...bottom)

    const mapped = raw.map(mapRecordToProduct).filter(Boolean) as AnyRecord[]

    if (mapped.length === 0) return NextResponse.json({ success: false, error: 'No valid rows to import' }, { status: 400 })

    // Deduplicate by url
    const byUrl = new Map<string, AnyRecord>()
    for (const r of mapped) {
      if (!byUrl.has(r.url)) byUrl.set(r.url, r)
    }
    const rows = Array.from(byUrl.values())

    // Upsert by url if unique exists, else insert
    let result
    try {
      result = await supabaseAdmin.from('products').upsert(rows, { onConflict: 'url' }).select('id')
    } catch {
      result = await supabaseAdmin.from('products').insert(rows).select('id')
    }

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, inserted: result.data?.length ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 })
  }
}


