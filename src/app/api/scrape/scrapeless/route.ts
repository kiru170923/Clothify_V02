import { NextRequest, NextResponse } from 'next/server'
import { scrapeUrl, crawlUrl } from '../../../../lib/scrapeless'
import { initSentry } from '../../../../lib/sentry'

initSentry()
import { normalizeProduct } from '../../../../lib/normalizer'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, mode = 'scrape', formats, limit = 5 } = body
    if (!url) return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 })

    console.log('🚀 Scrapeless request:', { url, mode, formats, limit })

    const start = Date.now()
    let result: any
    
    if (mode === 'crawl') {
      console.log('🕷️ Using CRAWL mode')
      result = await crawlUrl(url, { 
        limit,
        formats: formats || ['markdown'],
        onlyMainContent: true,
        timeout: 30000
      })
    } else {
      console.log('📄 Using SCRAPE mode')
      result = await scrapeUrl(url, { 
        formats: formats || ['markdown'],
        onlyMainContent: true,
        timeout: 30000
      })
    }

    const duration = Date.now() - start
    console.log('⏱️ Scrapeless duration:', duration + 'ms')

    // Handle different result formats
    let pages = []
    if (result.data && Array.isArray(result.data)) {
      pages = result.data
    } else if (result.data) {
      pages = [result.data]
    } else {
      pages = [result]
    }

    console.log('📊 Found pages:', pages.length)

    const products = []
    
    for (const page of pages) {
      const rawMarkdown = page?.markdown || null
      const rawHtml = page?.html || null
      const metadata = page?.metadata || { title: page?.title || null }
      const pageUrl = page?.url || url

      console.log('🔍 Processing page:', pageUrl)

      // Normalize product using heuristics
      const normalized = normalizeProduct({ 
        markdown: rawMarkdown, 
        html: rawHtml, 
        metadata, 
        url: pageUrl 
      })

      // If normalized.price found, also set top-level price
      const upsertPayload: any = {
        source_site: new URL(pageUrl).hostname,
        source_url: pageUrl,
        raw_markdown: rawMarkdown,
        raw_html: rawHtml,
        metadata: metadata,
        normalized: normalized,
      }
      if (normalized.price) upsertPayload.price = normalized.price

      products.push(upsertPayload)
    }

    // Insert all products
    if (products.length > 0) {
      console.log('💾 Inserting products:', products.length)
      
      const insert = await supabaseAdmin
        .from('products')
        .upsert(products, { onConflict: 'source_url' })

      if (insert.error) {
        console.error('❌ Insert product error:', insert.error)
        return NextResponse.json({ success: false, error: insert.error.message }, { status: 500 })
      }

      console.log('✅ Inserted products:', products.length)
    }

    return NextResponse.json({ 
      success: true, 
      duration, 
      products: products.length,
      pages: pages.length,
      result: result
    })
  } catch (error: any) {
    console.error('❌ Scrapeless API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error),
      stack: error.stack 
    }, { status: 500 })
  }
}


