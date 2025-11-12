-- ============================================
-- GENERATE FAKE DATA: TRY-ONS, MEMBERSHIPS, REVENUE
-- ============================================
-- This script generates fake data for:
-- 1. Try-on records (images table)
-- 2. Premium memberships (user_memberships table)
-- 3. Payment orders and revenue (payment_orders table)
-- Only for fake users (provider_id LIKE 'google_150%')
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Get fake users and membership plans
DO $$
DECLARE
  fake_user RECORD;
  plan_record RECORD;
  total_fake_users INTEGER;
  premium_users_count INTEGER;
  user_index INTEGER := 0;
  selected_user_id UUID;
  selected_plan_id UUID;
  plan_price INTEGER;
  billing_cycle TEXT;
  v_order_id TEXT;
  payment_date TIMESTAMP;
  membership_start TIMESTAMP;
  membership_end TIMESTAMP;
  tryon_date TIMESTAMP;
  start_date TIMESTAMP := '2024-10-25 00:00:00'::TIMESTAMP;
  end_date TIMESTAMP := NOW();
  days_span INTEGER;
  day_offset INTEGER;
  random_hour INTEGER;
  random_minute INTEGER;
  random_second INTEGER;
  tryon_count INTEGER;
  success_rate NUMERIC := 0.92; -- 92% success rate
  total_tryons INTEGER := 0;
BEGIN
  -- Calculate days span
  days_span := EXTRACT(EPOCH FROM (end_date - start_date)) / 86400;
  
  -- Get total fake users
  SELECT COUNT(*) INTO total_fake_users
  FROM public.users
  WHERE provider_id LIKE 'google_150%';
  
  -- Calculate premium users (4-5% of total fake users)
  premium_users_count := GREATEST(1, FLOOR(total_fake_users * 0.045)); -- 4.5%
  
  RAISE NOTICE 'Total fake users: %', total_fake_users;
  RAISE NOTICE 'Creating premium memberships for % users', premium_users_count;
  
  -- Get membership plans
  FOR plan_record IN 
    SELECT id, name, price_monthly, price_yearly
    FROM membership_plans
    WHERE name IN ('Standard', 'Medium', 'Premium')
    ORDER BY price_monthly
  LOOP
    RAISE NOTICE 'Plan: % (ID: %)', plan_record.name, plan_record.id;
  END LOOP;
  
  -- Step 2: Create premium memberships and payment orders
  user_index := 0;
  FOR fake_user IN 
    SELECT u.id as user_id, u.provider_id
    FROM public.users u
    WHERE u.provider_id LIKE 'google_150%'
    ORDER BY RANDOM()
    LIMIT premium_users_count
  LOOP
    user_index := user_index + 1;
    
    -- Select plan: 50% Standard, 30% Medium, 20% Premium
    IF user_index <= (premium_users_count * 0.5) THEN
      -- Standard plan
      SELECT id, price_monthly INTO selected_plan_id, plan_price
      FROM membership_plans
      WHERE name = 'Standard'
      LIMIT 1;
      billing_cycle := 'monthly';
    ELSIF user_index <= (premium_users_count * 0.8) THEN
      -- Medium plan
      SELECT id, price_monthly INTO selected_plan_id, plan_price
      FROM membership_plans
      WHERE name = 'Medium'
      LIMIT 1;
      billing_cycle := 'monthly';
    ELSE
      -- Premium plan
      SELECT id, price_monthly INTO selected_plan_id, plan_price
      FROM membership_plans
      WHERE name = 'Premium'
      LIMIT 1;
      billing_cycle := 'monthly';
    END IF;
    
    -- Generate random payment date (from Oct 25 to now, weighted towards early Nov)
    IF user_index <= (premium_users_count * 0.4) THEN
      -- 40% in early November spike
      day_offset := 7 + FLOOR(RANDOM() * 7); -- Nov 1-7
    ELSE
      -- 60% distributed across other days
      day_offset := FLOOR(RANDOM() * days_span);
    END IF;
    
    random_hour := FLOOR(RANDOM() * 24);
    random_minute := FLOOR(RANDOM() * 60);
    random_second := FLOOR(RANDOM() * 60);
    
    payment_date := start_date + (day_offset || ' days')::INTERVAL 
                    + (random_hour || ' hours')::INTERVAL
                    + (random_minute || ' minutes')::INTERVAL
                    + (random_second || ' seconds')::INTERVAL;
    
    IF payment_date > end_date THEN
      payment_date := end_date - (FLOOR(RANDOM() * 24) || ' hours')::INTERVAL;
    END IF;
    
    membership_start := payment_date;
    membership_end := payment_date + INTERVAL '1 month';
    
    -- Generate order_id
    v_order_id := 'ORDER_' || TO_CHAR(EXTRACT(EPOCH FROM payment_date)::BIGINT, 'FM999999999999999') || '_' || SUBSTRING(fake_user.user_id::TEXT, 1, 8);
    
    -- Create payment order
    INSERT INTO payment_orders (
      order_id,
      user_id,
      plan_id,
      billing_cycle,
      amount,
      status,
      payment_method,
      external_order_code,
      created_at,
      updated_at
    ) VALUES (
      v_order_id,
      fake_user.user_id,
      selected_plan_id,
      billing_cycle,
      plan_price,
      'completed',
      'payos',
      'PAYOS_' || v_order_id,
      payment_date,
      payment_date
    ) ON CONFLICT (order_id) DO NOTHING;
    
    -- Create membership
    INSERT INTO user_memberships (
      user_id,
      plan_id,
      status,
      start_date,
      end_date,
      billing_cycle,
      auto_renew,
      created_at,
      updated_at
    ) VALUES (
      fake_user.user_id,
      selected_plan_id,
      'active',
      membership_start,
      membership_end,
      billing_cycle,
      true,
      payment_date,
      payment_date
    ) ON CONFLICT DO NOTHING;
    
    -- Update user tokens based on plan
    UPDATE user_tokens
    SET total_tokens = CASE 
      WHEN selected_plan_id = (SELECT id FROM membership_plans WHERE name = 'Standard' LIMIT 1) THEN 30
      WHEN selected_plan_id = (SELECT id FROM membership_plans WHERE name = 'Medium' LIMIT 1) THEN 50
      WHEN selected_plan_id = (SELECT id FROM membership_plans WHERE name = 'Premium' LIMIT 1) THEN 100
      ELSE 3
    END,
    updated_at = payment_date
    WHERE user_id = fake_user.user_id;
    
    IF user_index % 5 = 0 THEN
      RAISE NOTICE 'Created % premium memberships...', user_index;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Completed! Created % premium memberships', premium_users_count;
  
  -- Step 3: Generate try-on records (images)
  -- Target: ~1.5 try-ons per user on average
  total_tryons := FLOOR(total_fake_users * 1.5);
  
  RAISE NOTICE 'Generating % try-on records...', total_tryons;
  
  user_index := 0;
  FOR fake_user IN 
    SELECT u.id as user_id
    FROM public.users u
    WHERE u.provider_id LIKE 'google_150%'
    ORDER BY RANDOM()
  LOOP
    -- Each user gets 0-4 try-ons
    tryon_count := FLOOR(RANDOM() * 5);
    
    FOR i IN 1..tryon_count LOOP
      IF user_index >= total_tryons THEN
        EXIT;
      END IF;
      
      -- Generate random date (weighted towards early Nov)
      IF user_index <= (total_tryons * 0.4) THEN
        day_offset := 7 + FLOOR(RANDOM() * 7); -- Nov 1-7
      ELSE
        day_offset := FLOOR(RANDOM() * days_span);
      END IF;
      
      random_hour := FLOOR(RANDOM() * 24);
      random_minute := FLOOR(RANDOM() * 60);
      random_second := FLOOR(RANDOM() * 60);
      
      tryon_date := start_date + (day_offset || ' days')::INTERVAL 
                    + (random_hour || ' hours')::INTERVAL
                    + (random_minute || ' minutes')::INTERVAL
                    + (random_second || ' seconds')::INTERVAL;
      
      IF tryon_date > end_date THEN
        tryon_date := end_date - (FLOOR(RANDOM() * 24) || ' hours')::INTERVAL;
      END IF;
      
      -- Determine status (92% success rate)
      DECLARE
        image_status TEXT;
        processing_time INTEGER;
      BEGIN
        IF RANDOM() < success_rate THEN
          image_status := 'completed';
          processing_time := 3000 + FLOOR(RANDOM() * 10000); -- 3-13 seconds
        ELSE
          image_status := 'failed';
          processing_time := 1000 + FLOOR(RANDOM() * 2000); -- 1-3 seconds
        END IF;
        
        -- Insert image record
        INSERT INTO images (
          user_id,
          person_image_url,
          clothing_image_url,
          result_image_url,
          status,
          processing_time,
          error_message,
          created_at,
          updated_at
        ) VALUES (
          fake_user.user_id,
          'https://example.com/person_' || SUBSTRING(fake_user.user_id::TEXT, 1, 8) || '.jpg',
          'https://example.com/clothing_' || SUBSTRING(fake_user.user_id::TEXT, 1, 8) || '.jpg',
          CASE WHEN image_status = 'completed' THEN 'https://example.com/result_' || SUBSTRING(fake_user.user_id::TEXT, 1, 8) || '.jpg' ELSE NULL END,
          image_status,
          processing_time,
          CASE WHEN image_status = 'failed' THEN 'Processing timeout' ELSE NULL END,
          tryon_date,
          tryon_date
        );
        
        user_index := user_index + 1;
      END;
    END LOOP;
    
    IF user_index >= total_tryons THEN
      EXIT;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Completed! Created % try-on records', user_index;
  
  -- Step 4: Update used_tokens based on completed try-ons
  UPDATE user_tokens ut
  SET used_tokens = (
    SELECT COUNT(*)
    FROM images i
    WHERE i.user_id = ut.user_id
      AND i.status = 'completed'
  ),
  updated_at = NOW()
  WHERE user_id IN (
    SELECT DISTINCT user_id
    FROM images
    WHERE user_id IN (
      SELECT id FROM public.users WHERE provider_id LIKE 'google_150%'
    )
  );
  
  RAISE NOTICE 'Updated used_tokens for users with try-ons';
  
END $$;

-- Step 5: Verify results
SELECT 
  'Premium Memberships' as metric,
  COUNT(*) as count
FROM user_memberships um
INNER JOIN public.users u ON um.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'
  AND um.status = 'active'

UNION ALL

SELECT 
  'Payment Orders (Completed)' as metric,
  COUNT(*) as count
FROM payment_orders po
INNER JOIN public.users u ON po.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'
  AND po.status = 'completed'

UNION ALL

SELECT 
  'Total Revenue (VND)' as metric,
  SUM(amount) as count
FROM payment_orders po
INNER JOIN public.users u ON po.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'
  AND po.status = 'completed'

UNION ALL

SELECT 
  'Try-On Records (Total)' as metric,
  COUNT(*) as count
FROM images i
INNER JOIN public.users u ON i.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'

UNION ALL

SELECT 
  'Try-On Records (Completed)' as metric,
  COUNT(*) as count
FROM images i
INNER JOIN public.users u ON i.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'
  AND i.status = 'completed'

UNION ALL

SELECT 
  'Try-On Records (Failed)' as metric,
  COUNT(*) as count
FROM images i
INNER JOIN public.users u ON i.user_id = u.id
WHERE u.provider_id LIKE 'google_150%'
  AND i.status = 'failed';

-- Step 6: Show membership distribution
SELECT 
  mp.name as plan_name,
  COUNT(*) as user_count,
  SUM(po.amount) as total_revenue
FROM user_memberships um
INNER JOIN membership_plans mp ON um.plan_id = mp.id
INNER JOIN public.users u ON um.user_id = u.id
LEFT JOIN payment_orders po ON po.user_id = um.user_id AND po.status = 'completed'
WHERE u.provider_id LIKE 'google_150%'
  AND um.status = 'active'
GROUP BY mp.name, mp.price_monthly
ORDER BY mp.price_monthly;

