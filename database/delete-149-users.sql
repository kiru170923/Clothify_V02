-- ============================================
-- DELETE 149 OLD USERS
-- ============================================
-- This script deletes the 149 users created by create-150-users.sql
-- Run this in Supabase SQL Editor
-- ============================================

-- Delete users by provider_id range (google_150001 to google_150149)
DELETE FROM public.user_tokens 
WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE provider_id LIKE 'google_150%' 
  AND provider_id >= 'google_150001' 
  AND provider_id <= 'google_150149'
);

DELETE FROM public.user_profiles 
WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE provider_id LIKE 'google_150%' 
  AND provider_id >= 'google_150001' 
  AND provider_id <= 'google_150149'
);

DELETE FROM public.users 
WHERE provider_id LIKE 'google_150%' 
AND provider_id >= 'google_150001' 
AND provider_id <= 'google_150149';

DELETE FROM auth.users 
WHERE id IN (
  SELECT id FROM public.users 
  WHERE provider_id LIKE 'google_150%' 
  AND provider_id >= 'google_150001' 
  AND provider_id <= 'google_150149'
);

-- Verify deletion
SELECT 
  'Remaining users with google_150% provider_id:' as info, 
  COUNT(*) as count 
FROM public.users 
WHERE provider_id LIKE 'google_150%';

