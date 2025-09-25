import { runNormalizerTests } from './normalizer.test'
import { runNluTests } from './nlu.test'

async function run() {
  console.log('Running unit tests (normalizer, nlu)')
  await runNormalizerTests()
  await runNluTests()
  console.log('All tests completed')
}

run().catch(e=>{ console.error('Test runner error', e); process.exit(1) })


