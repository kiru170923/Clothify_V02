-- ============================================
-- UPDATE FAKE DATA DATES TO NOVEMBER ONLY
-- ============================================
-- This script updates payment orders, memberships, and try-ons
-- to have dates in November only (for fake users only)
-- Run this in Supabase SQL Editor
-- ============================================

DO $$
DECLARE
  fake_user RECORD;
  payment_record RECORD;
  membership_record RECORD;
  image_record RECORD;
  start_date TIMESTAMP := '2024-11-01 00:00:00'::TIMESTAMP;
  end_date TIMESTAMP := NOW();
  days_span INTEGER;
  day_offset INTEGER;
  random_hour INTEGER;
  random_minute INTEGER;
  random_second INTEGER;
  new_date TIMESTAMP;
  user_index INTEGER := 0;
  total_count INTEGER;
BEGIN
  -- Calculate days span (Nov 1 to today)
  days_span := EXTRACT(EPOCH FROM (end_date - start_date)) / 86400;
  
  RAISE NOTICE 'Updating dates to November (Nov 1 to today)';
  RAISE NOTICE 'Days span: %', days_span;
  
  -- Step 1: Update payment_orders dates
  SELECT COUNT(*) INTO total_count
  FROM payment_orders po
  INNER JOIN public.users u ON po.user_id = u.id
  WHERE u.provider_id LIKE 'google_150%';
  
  RAISE NOTICE 'Updating % payment orders...', total_count;
  
  user_index := 0;
  FOR payment_record IN 
    SELECT po.id, po.user_id, po.created_at
    FROM payment_orders po
    INNER JOIN public.users u ON po.user_id = u.id
    WHERE u.provider_id LIKE 'google_150%'
    ORDER BY po.created_at
  LOOP
    user_index := user_index + 1;
    
    -- Distribution: 40% in early November (Nov 1-7), 60% distributed
    IF user_index <= (total_count * 0.4) THEN
      day_offset := FLOOR(RANDOM() * 7); -- Nov 1-7
    ELSE
      day_offset := FLOOR(RANDOM() * days_span);
    END IF;
    
    random_hour := FLOOR(RANDOM() * 24);
    random_minute := FLOOR(RANDOM() * 60);
    random_second := FLOOR(RANDOM() * 60);
    
    new_date := start_date + (day_offset || ' days')::INTERVAL 
                + (random_hour || ' hours')::INTERVAL
                + (random_minute || ' minutes')::INTERVAL
                + (random_second || ' seconds')::INTERVAL;
    
    IF new_date > end_date THEN
      new_date := end_date - (FLOOR(RANDOM() * 24) || ' hours')::INTERVAL;
    END IF;
    
    -- Update payment order
    UPDATE payment_orders
    SET created_at = new_date,
        updated_at = new_date
    WHERE id = payment_record.id;
    
    IF user_index % 10 = 0 THEN
      RAISE NOTICE 'Updated % payment orders...', user_index;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Completed! Updated % payment orders', user_index;
  
  -- Step 2: Update user_memberships dates (based on payment dates)
  SELECT COUNT(*) INTO total_count
  FROM user_memberships um
  INNER JOIN public.users u ON um.user_id = u.id
  WHERE u.provider_id LIKE 'google_150%';
  
  RAISE NOTICE 'Updating % memberships...', total_count;
  
  user_index := 0;
  FOR membership_record IN 
    SELECT um.id, um.user_id, um.start_date, um.billing_cycle
    FROM user_memberships um
    INNER JOIN public.users u ON um.user_id = u.id
    WHERE u.provider_id LIKE 'google_150%'
    ORDER BY um.created_at
  LOOP
    user_index := user_index + 1;
    
    -- Get payment date for this user
    SELECT created_at INTO new_date
    FROM payment_orders
    WHERE user_id = membership_record.user_id
      AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no payment found, generate random date
    IF new_date IS NULL THEN
      IF user_index <= (total_count * 0.4) THEN
        day_offset := FLOOR(RANDOM() * 7); -- Nov 1-7
      ELSE
        day_offset := FLOOR(RANDOM() * days_span);
      END IF;
      
      random_hour := FLOOR(RANDOM() * 24);
      random_minute := FLOOR(RANDOM() * 60);
      random_second := FLOOR(RANDOM() * 60);
      
      new_date := start_date + (day_offset || ' days')::INTERVAL 
                  + (random_hour || ' hours')::INTERVAL
                  + (random_minute || ' minutes')::INTERVAL
                  + (random_second || ' seconds')::INTERVAL;
      
      IF new_date > end_date THEN
        new_date := end_date - (FLOOR(RANDOM() * 24) || ' hours')::INTERVAL;
      END IF;
    END IF;
    
    -- Update membership (start_date = payment date, end_date = start_date + billing cycle)
    UPDATE user_memberships
    SET start_date = new_date,
        end_date = new_date + CASE 
          WHEN membership_record.billing_cycle = 'yearly' THEN INTERVAL '1 year'
          ELSE INTERVAL '1 month'
        END,
        created_at = new_date,
        updated_at = new_date
    WHERE id = membership_record.id;
    
    IF user_index % 10 = 0 THEN
      RAISE NOTICE 'Updated % memberships...', user_index;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Completed! Updated % memberships', user_index;
  
  -- Step 3: Update images (try-ons) dates
  SELECT COUNT(*) INTO total_count
  FROM images i
  INNER JOIN public.users u ON i.user_id = u.id
  WHERE u.provider_id LIKE 'google_150%';
  
  RAISE NOTICE 'Updating % try-on records...', total_count;
  
  user_index := 0;
  FOR image_record IN 
    SELECT i.id, i.user_id, i.created_at
    FROM images i
    INNER JOIN public.users u ON i.user_id = u.id
    WHERE u.provider_id LIKE 'google_150%'
    ORDER BY i.created_at
  LOOP
    user_index := user_index + 1;
    
    -- Distribution: 40% in early November (Nov 1-7), 60% distributed
    IF user_index <= (total_count * 0.4) THEN
      day_offset := FLOOR(RANDOM() * 7); -- Nov 1-7
    ELSE
      day_offset := FLOOR(RANDOM() * days_span);
    END IF;
    
    random_hour := FLOOR(RANDOM() * 24);
    random_minute := FLOOR(RANDOM() * 60);
    random_second := FLOOR(RANDOM() * 60);
    
    new_date := start_date + (day_offset || ' days')::INTERVAL 
                + (random_hour || ' hours')::INTERVAL
                + (random_minute || ' minutes')::INTERVAL
                + (random_second || ' seconds')::INTERVAL;
    
    IF new_date > end_date THEN
      new_date := end_date - (FLOOR(RANDOM() * 24) || ' hours')::INTERVAL;
    END IF;
    
    -- Update image record
    UPDATE images
    SET created_at = new_date,
        updated_at = new_date
    WHERE id = image_record.id;
    
    IF user_index % 50 = 0 THEN
      RAISE NOTICE 'Updated % try-on records...', user_index;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Completed! Updated % try-on records', user_index;
  
END $$;

-- Step 4: Verify updated dates
SELECT 
  'Payment Orders Date Range' as metric,
  MIN(po.created_at)::DATE as min_date,
  MAX(po.created_at)::DATE as max_date,
  COUNT(*) as count
FROM payment_orders po
INNER JOIN public.users u ON po.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'

UNION ALL

SELECT 
  'Memberships Date Range' as metric,
  MIN(um.start_date)::DATE as min_date,
  MAX(um.start_date)::DATE as max_date,
  COUNT(*) as count
FROM user_memberships um
INNER JOIN public.users u ON um.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'

UNION ALL

SELECT 
  'Try-Ons Date Range' as metric,
  MIN(i.created_at)::DATE as min_date,
  MAX(i.created_at)::DATE as max_date,
  COUNT(*) as count
FROM images i
INNER JOIN public.users u ON i.user_id = u.id
WHERE u.provider_id LIKE 'google_150%';

-- Step 5: Show distribution by day in November
SELECT 
  DATE(po.created_at) as date,
  COUNT(*) as payment_count
FROM payment_orders po
INNER JOIN public.users u ON po.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'
  AND po.created_at >= '2024-11-01'
GROUP BY DATE(po.created_at)
ORDER BY date;

SELECT 
  DATE(i.created_at) as date,
  COUNT(*) as tryon_count
FROM images i
INNER JOIN public.users u ON i.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'
  AND i.created_at >= '2024-11-01'
GROUP BY DATE(i.created_at)
ORDER BY date;

