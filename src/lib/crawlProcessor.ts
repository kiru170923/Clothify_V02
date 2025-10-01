import { scrapeUrl } from './scrapeless'
import { normalizeProduct } from './normalizer'
import { supabaseAdmin } from './supabaseAdmin'

export async function processUrl(url: string) {
  const result = await scrapeUrl(url, { formats: ['markdown', 'html', 'metadata'] })
  const page = Array.isArray(result.data) ? result.data[0] : result.data
  const rawMarkdown = page?.markdown || null
  const rawHtml = page?.html || null
  const metadata = page?.metadata || {}
  const normalized = normalizeProduct({ markdown: rawMarkdown, html: rawHtml, metadata, url })

  const upsertPayload: any = {
    source_site: new URL(url).hostname,
    source_url: url,
    raw_markdown: rawMarkdown,
    raw_html: rawHtml,
    metadata,
    normalized,
  }
  if (normalized.price) upsertPayload.price = normalized.price

  const { error } = await supabaseAdmin.from('products').upsert(upsertPayload, { onConflict: 'source_url' })
  if (error) throw error
  return { url, ok: true }
}


