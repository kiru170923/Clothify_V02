-- Update existing QR codes from localhost to production URLs
-- Run this AFTER setting NEXT_PUBLIC_BASE_URL in Vercel

-- Replace 'YOUR_PRODUCTION_URL' with your actual domain
-- Example: https://clothify-v02.vercel.app

-- Preview changes first:
SELECT 
  code,
  'http://localhost:3000/try/' || code as old_url,
  'YOUR_PRODUCTION_URL/try/' || code as new_url
FROM qr_codes
WHERE created_at IS NOT NULL;

-- If URLs look correct, run this to update:
-- UPDATE qr_codes SET updated_at = NOW();
-- (URLs are generated dynamically from code, no need to store them)

-- OR if you want to delete old QRs and start fresh:
-- DELETE FROM qr_codes WHERE created_at < NOW();

-- Note: Public URLs are generated dynamically in the API based on NEXT_PUBLIC_BASE_URL
-- So once you set the env var in Vercel and redeploy, NEW QR codes will have correct URLs
-- Old QR codes will still work (code is the same), just the displayed URL will be localhost

-- Recommendation: Just create new QR codes after setting production URL



