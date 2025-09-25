import { normalizeProduct } from '../../src/lib/normalizer'

export async function runNormalizerTests() {
  console.log('[normalizer] Running tests')
  const md = `# Áo khoác len\n\nGiá: 395,000 ₫\n\n![img](https://example.com/a.jpg)\n\nÁo cadigan dáng ngắn cổ tim.`
  const res = normalizeProduct({ markdown: md, html: null, metadata: { title: 'Áo khoác len 5404' } })
  console.log('[normalizer] result:', { title: res.title, price: res.price, images: res.images?.length })
  if (!res.title) throw new Error('Title not extracted')
  if (!res.images || res.images.length === 0) throw new Error('Images not extracted')
  console.log('[normalizer] OK')
}


