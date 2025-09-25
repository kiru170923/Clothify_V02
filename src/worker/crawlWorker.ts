import { startWorker } from '../lib/bullQueue'

async function main() {
  try {
    console.log('Starting crawl worker...')
    const w = startWorker()
    console.log('Worker started')
    // keep process alive
    process.on('SIGINT', async () => { console.log('SIGINT'); process.exit(0) })
    process.on('SIGTERM', async () => { console.log('SIGTERM'); process.exit(0) })
  } catch (e) {
    console.error('Worker failed to start', e)
    process.exit(1)
  }
}

main()


