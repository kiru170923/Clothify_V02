export function captureException(e: any) {
  try {
    console.error('Captured exception:', e)
    // If SENTRY_DSN is set, you can add Sentry initialization here.
    // Keeping lightweight to avoid extra deps. If needed, we can add @sentry/node.
  } catch (err) {
    console.error('Failed to capture exception:', err)
  }
}


