import { classifyIntent } from '../../src/lib/nlu'

export async function runNluTests() {
  console.log('[nlu] Running tests')
  const c1 = classifyIntent('Tìm áo khoác len dưới 300k màu kem')
  console.log('[nlu] case1:', c1)
  if (c1.intent !== 'search') throw new Error('Intent should be search')
  const c2 = classifyIntent('Mặc size M')
  console.log('[nlu] case2:', c2)
  if (c2.intent !== 'update_profile') throw new Error('Intent should be update_profile')
  console.log('[nlu] OK')
}


