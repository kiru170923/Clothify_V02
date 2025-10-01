﻿import { NextRequest, NextResponse } from 'next/server'
import { scrapeUrl, crawlUrl } from '../../../../lib/scrapeless'
import { initSentry } from '../../../../lib/sentry'

initSentry()
import { normalizeProduct } from '../../../../lib/normalizer'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, mode = 'scrape', formats, limit = 5 } = body
    if (!url) return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 })

    console.log('ðŸš€ Scrapeless request:', { url, mode, formats, limit })

    const start = Date.now()
    let result: any
    
    if (mode === 'crawl') {
      console.log('ðŸ•·ï¸ Using CRAWL mode')
      result = await crawlUrl(url, { 
        limit,
        formats: formats || ['markdown'],
        onlyMainContent: true,
        timeout: 30000
      })
    } else {
      console.log('ðŸ“„ Using SCRAPE mode')
      result = await scrapeUrl(url, { 
        formats: formats || ['markdown'],
        onlyMainContent: true,
        timeout: 30000
      })
    }

    const duration = Date.now() - start
    console.log('â±ï¸ Scrapeless duration:', duration + 'ms')

    // Handle different result formats
    let pages = []
    if (result.data && Array.isArray(result.data)) {
      pages = result.data
    } else if (result.data) {
      pages = [result.data]
    } else {
      pages = [result]
    }

    console.log('ðŸ“Š Found pages:', pages.length)

    const products = []
    
    for (const page of pages) {
      const rawMarkdown = page?.markdown || null
      const rawHtml = page?.html || null
      const metadata = page?.metadata || { title: page?.title || null }
      const pageUrl = page?.url || url

      console.log('ðŸ” Processing page:', pageUrl)

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
      console.log('ðŸ’¾ Inserting products:', products.length)
      
      const insert = await supabaseAdmin
        .from('products')
        .upsert(products, { onConflict: 'source_url' })

      if (insert.error) {
        console.error('âŒ Insert product error:', insert.error)
        return NextResponse.json({ success: false, error: insert.error.message }, { status: 500 })
      }

      console.log('âœ… Inserted products:', products.length)
    }

    return NextResponse.json({ 
      success: true, 
      duration, 
      products: products.length,
      pages: pages.length,
      result: result
    })
  } catch (error: any) {
    console.error('âŒ Scrapeless API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error),
      stack: error.stack 
    }, { status: 500 })
  }
}



