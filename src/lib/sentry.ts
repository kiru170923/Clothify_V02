import * as Sentry from '@sentry/node'
import { RewriteFrames } from '@sentry/integrations'

export function initSentry() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    integrations: []
  })
}

export const captureException = (e:any) => {
  if ((globalThis as any).Sentry) (globalThis as any).Sentry.captureException(e)
  console.error(e)
}


