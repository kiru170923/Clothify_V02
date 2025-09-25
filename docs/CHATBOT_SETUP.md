# Clothify Chatbot - Setup & Runbook

Minimal checklist to run chatbot features (crawl, search, chat, recommend).

## Required environment variables
- `SCRAPELESS_API_KEY` - Scrapeless API key
- `NEXTAUTH_URL` or `NEXT_PUBLIC_APP_URL` - App URL used for redirects
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public client
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server-only)
- `SCRAPE_JOB_SECRET` - (optional) secret for batch crawl endpoint
- `SENTRY_DSN` - (optional) Sentry DSN for error reporting

## Running SQL migrations
Run these in Supabase SQL editor (in order):
- `database/chatbot_schema_phase1.sql`
- `database/chatbot_search_phase4.sql`

## Testing endpoints locally
- Single scrape:
  ```bash
  curl -X POST "http://localhost:3000/api/scrape/scrapeless" -H "Content-Type: application/json" -d '{"url":"https://twentyfive.vn/search?q=ao+khoac+len"}'
  ```
- Batch enqueue (use SCRAPE_JOB_SECRET in prod):
  ```bash
  curl -X POST "http://localhost:3000/api/scrape/batch" -H "Content-Type: application/json" -H "x-scrape-secret: $SCRAPE_JOB_SECRET" -d '{"urls":["https://twentyfive.vn/search?q=ao+khoac+len"]}'
  ```
- Search:
  ```bash
  curl -X POST "http://localhost:3000/api/products/search" -H "Content-Type: application/json" -d '{"q":"áo khoác len","limit":5}'
  ```

## Run unit tests (local)
Install deps then run:
```bash
npm install
npm run test:unit
```

## GitHub Actions cron
Set repository secrets: `APP_URL`, `SCRAPE_JOB_SECRET`, `CRAWL_URLS` (newline separated), then enable workflow `.github/workflows/cron-crawl.yml`.

## Monitoring
- Set `SENTRY_DSN` to enable Sentry; process uses `src/lib/sentry.ts`.


