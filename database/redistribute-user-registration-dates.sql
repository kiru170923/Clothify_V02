-- ============================================
-- REDISTRIBUTE USER REGISTRATION DATES
-- ============================================
-- This script redistributes user registration dates from Oct 25 to today
-- with a spike in early November (first week)
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Get only fake users (users with provider_id starting with 'google_150')
DO $$
DECLARE
  user_record RECORD;
  total_users INTEGER;
  user_index INTEGER := 0;
  start_date TIMESTAMP := '2024-10-25 00:00:00'::TIMESTAMP;
  end_date TIMESTAMP := NOW();
  days_span INTEGER;
  new_date TIMESTAMP;
  -- Distribution weights: more users in early November
  day_offset INTEGER;
  spike_start INTEGER; -- Nov 1 = day 7 (Oct 25 + 7 days)
  spike_end INTEGER;   -- Nov 7 = day 13
  random_hour INTEGER;
  random_minute INTEGER;
  random_second INTEGER;
BEGIN
  -- Calculate days span
  days_span := EXTRACT(EPOCH FROM (end_date - start_date)) / 86400;
  
  -- Early November spike: Nov 1-7 (days 7-13 from Oct 25)
  spike_start := 7;
  spike_end := 13;
  
  -- Get total fake users only (provider_id like 'google_150%')
  SELECT COUNT(*) INTO total_users 
  FROM public.user_profiles up
  INNER JOIN public.users u ON up.user_id = u.id
  WHERE u.provider_id LIKE 'google_150%';
  
  RAISE NOTICE 'Total fake users to redistribute: %', total_users;
  RAISE NOTICE 'Date range: % to %', start_date, end_date;
  RAISE NOTICE 'Days span: %', days_span;
  
  -- Loop through only fake users
  FOR user_record IN 
    SELECT up.user_id, up.created_at 
    FROM public.user_profiles up
    INNER JOIN public.users u ON up.user_id = u.id
    WHERE u.provider_id LIKE 'google_150%'
    ORDER BY up.created_at
  LOOP
    user_index := user_index + 1;
    
    -- Distribution logic:
    -- 40% of users in early November spike (Nov 1-7)
    -- 30% in late October (Oct 25-31)
    -- 20% in mid November (Nov 8-14)
    -- 10% in recent days (Nov 15+)
    
    IF user_index <= (total_users * 0.40) THEN
      -- 40% in spike period (Nov 1-7)
      day_offset := spike_start + FLOOR(RANDOM() * (spike_end - spike_start + 1));
    ELSIF user_index <= (total_users * 0.70) THEN
      -- 30% in late October (Oct 25-31, days 0-6)
      day_offset := FLOOR(RANDOM() * 7);
    ELSIF user_index <= (total_users * 0.90) THEN
      -- 20% in mid November (Nov 8-14, days 14-20)
      day_offset := 14 + FLOOR(RANDOM() * 7);
    ELSE
      -- 10% in recent days (Nov 15+, days 21+)
      day_offset := 21 + FLOOR(RANDOM() * (days_span - 21));
    END IF;
    
    -- Ensure day_offset doesn't exceed days_span
    IF day_offset > days_span THEN
      day_offset := days_span;
    END IF;
    
    -- Generate random time within the day
    random_hour := FLOOR(RANDOM() * 24);
    random_minute := FLOOR(RANDOM() * 60);
    random_second := FLOOR(RANDOM() * 60);
    
    -- Calculate new date
    new_date := start_date + (day_offset || ' days')::INTERVAL 
                + (random_hour || ' hours')::INTERVAL
                + (random_minute || ' minutes')::INTERVAL
                + (random_second || ' seconds')::INTERVAL;
    
    -- Ensure new_date doesn't exceed end_date
    IF new_date > end_date THEN
      new_date := end_date - (FLOOR(RANDOM() * 24) || ' hours')::INTERVAL;
    END IF;
    
    -- Update user_profiles
    UPDATE public.user_profiles
    SET created_at = new_date,
        updated_at = new_date
    WHERE user_id = user_record.user_id;
    
    -- Update public.users
    UPDATE public.users
    SET created_at = new_date,
        updated_at = new_date
    WHERE id = user_record.user_id;
    
    -- Update auth.users
    UPDATE auth.users
    SET created_at = new_date,
        updated_at = new_date
    WHERE id = user_record.user_id;
    
    -- Log progress every 50 users
    IF user_index % 50 = 0 THEN
      RAISE NOTICE 'Processed % users...', user_index;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Completed! Redistributed % users', total_users;
END $$;

-- Step 2: Verify distribution (only fake users)
SELECT 
  DATE(up.created_at) as registration_date,
  COUNT(*) as user_count
FROM public.user_profiles up
INNER JOIN public.users u ON up.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'
  AND up.created_at >= '2024-10-25'
GROUP BY DATE(up.created_at)
ORDER BY registration_date;

-- Step 3: Show summary by period (only fake users)
SELECT 
  CASE 
    WHEN up.created_at >= '2024-10-25' AND up.created_at < '2024-11-01' THEN 'Late October (Oct 25-31)'
    WHEN up.created_at >= '2024-11-01' AND up.created_at < '2024-11-08' THEN 'Early November Spike (Nov 1-7)'
    WHEN up.created_at >= '2024-11-08' AND up.created_at < '2024-11-15' THEN 'Mid November (Nov 8-14)'
    WHEN up.created_at >= '2024-11-15' THEN 'Recent (Nov 15+)'
    ELSE 'Other'
  END as period,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / (
    SELECT COUNT(*) 
    FROM public.user_profiles up2
    INNER JOIN public.users u2 ON up2.user_id = u2.id
    WHERE u2.provider_id LIKE 'google_150%'
      AND up2.created_at >= '2024-10-25'
  ), 1) as percentage
FROM public.user_profiles up
INNER JOIN public.users u ON up.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'
  AND up.created_at >= '2024-10-25'
GROUP BY 
  CASE 
    WHEN up.created_at >= '2024-10-25' AND up.created_at < '2024-11-01' THEN 'Late October (Oct 25-31)'
    WHEN up.created_at >= '2024-11-01' AND up.created_at < '2024-11-08' THEN 'Early November Spike (Nov 1-7)'
    WHEN up.created_at >= '2024-11-08' AND up.created_at < '2024-11-15' THEN 'Mid November (Nov 8-14)'
    WHEN up.created_at >= '2024-11-15' THEN 'Recent (Nov 15+)'
    ELSE 'Other'
  END
ORDER BY 
  MIN(up.created_at);

