import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { scrapeUrl, crawlUrl } from '../../../../lib/scrapeless'
import { normalizeProduct } from '../../../../lib/normalizer'
import { initSentry } from '../../../../lib/sentry'

initSentry()

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const refresh = searchParams.get('refresh') === 'true'

    const { data: product, error } = await supabaseAdmin.from('products').select('*').eq('id', id).maybeSingle()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    if (!product) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    if (!refresh) return NextResponse.json({ success: true, product })

    // If refresh requested, try real-time scrape of source_url
    if (!product.source_url) return NextResponse.json({ success: true, product })

    try {
      const result = await scrapeUrl(product.source_url, { formats: ['markdown','html','metadata'] })
      const page = Array.isArray(result.data) ? result.data[0] : result.data
      const rawMarkdown = page?.markdown || null
      const rawHtml = page?.html || null
      const metadata = page?.metadata || {}
      const normalized = normalizeProduct({ markdown: rawMarkdown, html: rawHtml, metadata, url: product.source_url })

      const updatePayload: any = { raw_markdown: rawMarkdown, raw_html: rawHtml, metadata, normalized }
      if (normalized.price) updatePayload.price = normalized.price

      const { error: upsertErr } = await supabaseAdmin.from('products').update(updatePayload).eq('id', product.id)
      if (upsertErr) console.error('Failed to update product after refresh:', upsertErr)

      const { data: updated } = await supabaseAdmin.from('products').select('*').eq('id', id).maybeSingle()
      return NextResponse.json({ success: true, product: updated })
    } catch (scrapeErr: any) {
      console.error('Realtime scrape error:', scrapeErr)
      return NextResponse.json({ success: true, product, warning: 'Realtime scrape failed' })
    }

  } catch (error: any) {
    console.error('Product detail error:', error)
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 })
  }
}


