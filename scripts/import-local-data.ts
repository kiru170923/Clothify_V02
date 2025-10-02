/*
  Usage:
    npx ts-node scripts/import-local-data.ts

  Requires server-side env for Supabase (service role) available to Node process.
*/

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

type AnyRecord = Record<string, any>

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..')
// Load env (best-effort)
dotenv.config({ path: path.join(projectRoot, '.env.local') })
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in env')
}
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function readJsonSafe(p: string) {
  try {
    const raw = await fs.readFile(p, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

function toArray(v: any): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string' && x.trim())
  if (typeof v === 'string' && v.trim()) return [v.trim()]
  return []
}

function pickFirstImage(images: string[]) {
  return images.find((u) => typeof u === 'string' && /^https?:\/\//.test(u)) || null
}

function buildSearchBooster(row: AnyRecord) {
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

function mapRecordToProduct(rec: AnyRecord): AnyRecord | null {
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

async function main() {
  console.log('Import: starting...')
  const topPath = path.join(projectRoot, 'data', 'top.json')
  const bottomPath = path.join(projectRoot, 'data', 'bottom.json')

  const [top, bottom] = await Promise.all([readJsonSafe(topPath), readJsonSafe(bottomPath)])
  if (!top && !bottom) throw new Error('No data files found in ./data (top.json, bottom.json)')

  const raw: AnyRecord[] = []
  if (Array.isArray(top)) raw.push(...top)
  if (Array.isArray(bottom)) raw.push(...bottom)

  const mapped = raw.map(mapRecordToProduct).filter(Boolean) as AnyRecord[]
  console.log('Import: mapped valid rows =', mapped.length)
  if (mapped.length === 0) {
    console.log('Nothing to insert. Exiting.')
    return
  }

  // Deduplicate by url
  const byUrl = new Map<string, AnyRecord>()
  for (const r of mapped) {
    if (!byUrl.has(r.url)) byUrl.set(r.url, r)
  }
  const rows = Array.from(byUrl.values())
  console.log('Import: deduped rows =', rows.length)

  // Upsert by url if possible; else insert
  const { data, error } = await supabaseAdmin.from('products').upsert(rows, { onConflict: 'url' }).select('id')
  if (error) {
    console.error('Upsert failed, trying insert:', error.message)
    const ins = await supabaseAdmin.from('products').insert(rows).select('id')
    if (ins.error) throw new Error(ins.error.message)
    console.log('Inserted:', ins.data?.length ?? 0)
    return
  }
  console.log('Upserted:', data?.length ?? 0)
}

main().catch((e) => {
  console.error('Import error:', e)
  process.exitCode = 1
})


