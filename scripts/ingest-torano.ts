import fs from 'fs/promises'
import path from 'path'
import { htmlToText } from 'html-to-text'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const DRY_RUN = process.env.DRY_RUN === '1'
const DATA_FILES = ['top.json', 'bottom.json']
const EMBEDDING_DIM = 1536

let cachedSupabase: any = null
const getSupabase = async () => {
  if (cachedSupabase) return cachedSupabase
  const mod = await import('../src/lib/supabaseAdmin')
  cachedSupabase = mod.supabaseAdmin
  return cachedSupabase
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is missing in environment')
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface RawVariant { sku?: string; id?: string | number; color?: string; size?: string; price?: number | string }
interface RawProduct {
  id: number
  title: string
  handle?: string
  url: string
  price: number | string
  compare_at_price?: number | string | null
  image?: string
  vendor?: string
  tags?: string[]
  created_at?: string
  gallery?: string[]
  tabs?: { descriptionHtml?: string; returnPolicy?: string; privacyPolicy?: string }
  variants?: RawVariant[]
}

type ChunkKind = 'overview' | 'features' | 'variants' | 'policy'

interface NormalizedVariant { sku?: string; id?: string | number; color?: string; size?: string; price?: number }
interface NormalizedProduct {
  id: number
  title: string
  handle?: string
  url: string
  image?: string
  gallery: string[]
  price: number
  compare_at_price?: number | null
  vendor?: string
  tags: string[]
  created_at?: string | null
  description_text?: string
  tabs: { descriptionHtml?: string | null; returnPolicy?: string | null; privacyPolicy?: string | null }
  variants: NormalizedVariant[]
  style: string[]
  occasion: string[]
  match_with: string[]
  why_recommend: string
  search_booster: string
  category_guess: string
  fit_guess: string
}

const COLOR_MAP: Record<string, string> = {
  'den': 'black',
  'trang': 'white',
  'xanh navy': 'navy',
  'xanh da troi': 'sky blue',
  'xam nhat': 'light gray',
  'xam dam': 'dark gray',
  'be': 'beige',
  'nau': 'brown',
  'vang': 'yellow',
  'hong': 'pink',
  'do': 'red',
  'tim': 'purple',
  'olive': 'olive',
}

const STYLE_RULES: Array<{ regex: RegExp; styles: string[]; occasions: string[]; category?: string; fit?: string }> = [
  { regex: /(jean|denim|quan jeans)/i, styles: ['casual'], occasions: ['di choi', 'di lam'], category: 'quan_jeans' },
  { regex: /(kaki|chino)/i, styles: ['smart-casual'], occasions: ['di lam', 'di choi'], category: 'quan_kaki' },
  { regex: /(short|quan short)/i, styles: ['casual'], occasions: ['di choi', 'du lich'], category: 'quan_short' },
  { regex: /(polo)/i, styles: ['casual', 'smart-casual'], occasions: ['di choi', 'di lam'], category: 'ao_polo' },
  { regex: /(so\s*mi|somi|shirt)/i, styles: ['smart-casual', 'formal'], occasions: ['di lam', 'di tiec'], category: 'ao_so_mi' },
  { regex: /(slim\s*fit|slimfit)/i, styles: [], occasions: [], fit: 'slimfit' },
]

const DEFAULT_MATCH_WITH_TOP = ['Quan jeans slimfit', 'Quan chino cung tong', 'Sneaker trang toi gian']
const DEFAULT_MATCH_WITH_BOTTOM = ['Ao polo tron', 'Ao so mi trang', 'Ao thun basic']

const httpsify = (input?: string | null): string | undefined => {
  if (!input) return undefined
  let url = input.trim()
  if (!url) return undefined
  if (url.startsWith('//')) url = 'https:' + url
  if (url.startsWith('http:')) url = 'https:' + url.slice(5)
  if (!/^https?:/i.test(url)) url = 'https://' + url.replace(/^\/+/, '')
  url = url.replace('https://torano.vn//', 'https://torano.vn/')
  url = url.replace('https://cdn.hstatic.net//', 'https://cdn.hstatic.net/')
  return url
}

const normalizePrice = (value: number): number => (value > 9_999_999 ? Math.round(value / 100) : Math.round(value))
const parsePrice = (value: any): number => {
  if (value == null) return 0
  if (typeof value === 'number') return normalizePrice(value)
  const n = parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0
  return normalizePrice(n)
}

const stripHtml = (html?: string | null): string | undefined => {
  if (!html) return undefined
  return htmlToText(html, { wordwrap: 120, selectors: [{ selector: 'img', format: 'skip' }] }).replace(/\s+/g, ' ').trim()
}

const removeDiacritics = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const normalizeTag = (value: string) => removeDiacritics(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
const normalizeColor = (value?: string) => {
  if (!value) return undefined
  const key = removeDiacritics(value).toLowerCase().trim()
  return COLOR_MAP[key] || value.trim().toLowerCase()
}
const normalizeSize = (value?: string) => {
  if (!value) return undefined
  const trimmed = value.trim()
  return /^\d+(?:[./]\d+)?$/.test(trimmed) ? trimmed : trimmed.toUpperCase()
}

function inferAttributes(title: string, tags: string[]) {
  const haystack = (title + ' ' + tags.join(' ')).toLowerCase()
  const styleSet = new Set<string>()
  const occasionSet = new Set<string>()
  let category = 'khac'
  let fit = 'regular'
  for (const rule of STYLE_RULES) {
    if (rule.regex.test(haystack)) {
      rule.styles.forEach((s) => styleSet.add(s))
      rule.occasions.forEach((o) => occasionSet.add(o))
      if (rule.category && category === 'khac') category = rule.category
      if (rule.fit) fit = rule.fit
    }
  }
  if (styleSet.size === 0) styleSet.add('casual')
  if (occasionSet.size === 0) occasionSet.add('di choi')
  return { style: Array.from(styleSet), occasion: Array.from(occasionSet), category_guess: category, fit_guess: fit }
}

const buildMatchTargets = (category: string) => (
  category.startsWith('ao_') ? DEFAULT_MATCH_WITH_TOP :
  category.startsWith('quan_') ? DEFAULT_MATCH_WITH_BOTTOM :
  ['Sneaker trang toi gian']
)

const buildWhyRecommend = (style: string[], occasion: string[], fit: string) => {
  const occ = occasion.slice(0, 2).join(', ') || 'nhieu dip'
  const sty = style.slice(0, 2).join(', ') || 'da dang'
  const fitText = fit === 'regular' ? 'form de mac' : `form ${fit}`
  return `Phu hop ${occ}, ${fitText}, phong cach ${sty}.`
}

const buildSearchBooster = (product: NormalizedProduct) => {
  const tokens: string[] = []
  tokens.push(product.title, removeDiacritics(product.title))
  product.tags.forEach((tag) => { tokens.push(tag); tokens.push(removeDiacritics(tag)) })
  product.style.forEach((s) => tokens.push(s))
  product.occasion.forEach((o) => tokens.push(o))
  product.variants.forEach((v) => {
    const color = normalizeColor(v.color)
    const size = normalizeSize(v.size)
    if (color) { tokens.push(color); tokens.push(removeDiacritics(color)) }
    if (size) { tokens.push(`size ${size}`); tokens.push(`size ${size.toLowerCase()}`) }
  })
  return Array.from(new Set(tokens.filter(Boolean))).join(' | ')
}

function buildChunks(product: NormalizedProduct) {
  const overview = `[OVERVIEW]\nTen: ${product.title}\nLoai: ${product.category_guess} ; Fit: ${product.fit_guess}\nGia: ${product.price} VND\nDIP: ${product.occasion.join(', ')} ; Style: ${product.style.join(', ')}\nLy do: ${product.why_recommend}\nLink: ${product.url}`

  const description = product.description_text || ''
  const sentences = description.split(/[.•\n\r]/).map((s) => s.trim()).filter(Boolean).slice(0, 6)
  const features = `[FEATURES]\nMo ta:\n${sentences.length ? sentences.map((s) => `- ${s}`).join('\n') : '- Dang cap nhat.'}`

  const colors = Array.from(new Set(product.variants.map((v) => normalizeColor(v.color)).filter(Boolean)))
  const sizes = Array.from(new Set(product.variants.map((v) => normalizeSize(v.size)).filter(Boolean)))
  const variants = `[VARIANTS]\nMau: ${colors.join(', ') || 'n/a'}\nSize: ${sizes.join(', ') || 'n/a'}\nDanh sach:\n${product.variants.slice(0, 60).map((v) => `- SKU ${v.sku || 'n/a'} | ${normalizeColor(v.color) || 'n/a'} | ${normalizeSize(v.size) || 'n/a'} | Gia: ${v.price || product.price} VND`).join('\n')}`

  const policyText = stripHtml(product.tabs.returnPolicy) || 'Doi hang 1 lan trong 7 ngay neu con tem mac va chua su dung.'
  const policy = `[POLICY]\n${policyText}`

  return [
    { kind: 'overview' as ChunkKind, content: overview },
    { kind: 'features' as ChunkKind, content: features },
    { kind: 'variants' as ChunkKind, content: variants },
    { kind: 'policy' as ChunkKind, content: policy },
  ]
}

function normalizeProduct(raw: RawProduct): NormalizedProduct {
  const gallery = (raw.gallery || []).slice(0, 4).map(httpsify).filter(Boolean) as string[]
  const tags = (raw.tags || []).map(normalizeTag).filter(Boolean)
  const description_text = stripHtml(raw.tabs?.descriptionHtml)
  const infer = inferAttributes(raw.title, tags)
  const variants: NormalizedVariant[] = (raw.variants || []).map((v) => ({
    sku: v.sku,
    id: v.id,
    color: v.color,
    size: v.size,
    price: parsePrice(v.price),
  }))

  const product: NormalizedProduct = {
    id: raw.id,
    title: raw.title,
    handle: raw.handle,
    url: httpsify(raw.url) || raw.url,
    image: httpsify(raw.image),
    gallery,
    price: parsePrice(raw.price),
    compare_at_price: parsePrice(raw.compare_at_price) || null,
    vendor: raw.vendor || 'TORANO',
    tags,
    created_at: raw.created_at || null,
    description_text,
    tabs: {
      descriptionHtml: raw.tabs?.descriptionHtml || null,
      returnPolicy: raw.tabs?.returnPolicy || null,
      privacyPolicy: raw.tabs?.privacyPolicy || null,
    },
    variants,
    style: infer.style,
    occasion: infer.occasion,
    match_with: buildMatchTargets(infer.category_guess),
    why_recommend: buildWhyRecommend(infer.style, infer.occasion, infer.fit_guess),
    search_booster: '',
    category_guess: infer.category_guess,
    fit_guess: infer.fit_guess,
  }

  product.search_booster = buildSearchBooster(product)
  return product
}

async function readRawProducts(): Promise<RawProduct[]> {
  const base = path.join(process.cwd(), 'data')
  const products: RawProduct[] = []
  for (const file of DATA_FILES) {
    const filePath = path.join(base, file)
    const exists = await fs.stat(filePath).then(() => true).catch(() => false)
    if (!exists) continue
    const raw = JSON.parse(await fs.readFile(filePath, 'utf8')) as RawProduct[]
    products.push(...raw)
  }
  return products
}

async function embedText(text: string) {
  const result = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
  const embedding = result.data[0]?.embedding
  if (!embedding || embedding.length !== EMBEDDING_DIM) throw new Error('Invalid embedding returned from OpenAI')
  return embedding
}

async function upsertProduct(product: NormalizedProduct) {
  if (DRY_RUN) {
    console.log(`📝 [DRY_RUN] upsert product ${product.id}`)
    return
  }
  const supabase = await getSupabase()
  const { error } = await supabase.from('products').upsert({
    id: product.id,
    title: product.title,
    handle: product.handle,
    url: product.url,
    image: product.image,
    gallery: product.gallery,
    price: product.price,
    compare_at_price: product.compare_at_price,
    vendor: product.vendor,
    tags: product.tags,
    created_at: product.created_at,
    description_text: product.description_text,
    tabs: product.tabs,
    variants: product.variants,
    style: product.style,
    occasion: product.occasion,
    match_with: product.match_with,
    why_recommend: product.why_recommend,
    search_booster: product.search_booster,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(`Supabase upsert failed for product ${product.id}: ${error.message}`)
}

async function replaceEmbeddings(productId: number, chunks: Array<{ kind: ChunkKind; content: string }>) {
  if (DRY_RUN) {
    console.log(`📝 [DRY_RUN] skip embeddings for ${productId}`)
    return
  }
  const supabase = await getSupabase()
  const { error: deleteError } = await supabase
    .from('product_embeddings')
    .delete()
    .eq('product_id', productId)
  if (deleteError) throw new Error(`Failed to delete embeddings for product ${productId}: ${deleteError.message}`)

  for (const chunk of chunks) {
    const embedding = await embedText(chunk.content)
    const { error } = await supabase.from('product_embeddings').insert({
      product_id: productId,
      chunk_kind: chunk.kind,
      content: chunk.content,
      embedding,
    })
    if (error) throw new Error(`Failed to insert embedding for product ${productId}: ${error.message}`)
  }
}

async function ingest() {
  const rawProducts = await readRawProducts()
  console.log(`📦 Loaded ${rawProducts.length} products.`)
  let success = 0
  for (const raw of rawProducts) {
    try {
      const product = normalizeProduct(raw)
      await upsertProduct(product)
      const chunks = buildChunks(product)
      await replaceEmbeddings(product.id, chunks)
      success += 1
      if (success % 10 === 0) {
        console.log(`✅ Ingested ${success} products...`)
      }
    } catch (err) {
      console.error(`❌ Error ingesting product ${raw.id}:`, err)
    }
  }
  console.log(`🎉 Finished ingest ${success}/${rawProducts.length} products.`)
}

ingest().catch((err) => {
  console.error('🚨 Ingest failed:', err)
  process.exit(1)
})
