-- Check which wardrobe table actually exists and has data
-- Run this in Supabase SQL Editor

-- 1. Check if user_wardrobe table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_wardrobe'
) AS user_wardrobe_exists;

-- 2. Check if user_wardrobe_items table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_wardrobe_items'
) AS user_wardrobe_items_exists;

-- 3. Count rows in user_wardrobe (if exists)
-- SELECT COUNT(*) as user_wardrobe_count FROM user_wardrobe;

-- 4. Count rows in user_wardrobe_items (if exists)
-- SELECT COUNT(*) as user_wardrobe_items_count FROM user_wardrobe_items;

-- 5. Show all wardrobe tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%wardrobe%'
ORDER BY table_name;

-- 6. Show columns of user_wardrobe (if exists)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_wardrobe' 
-- ORDER BY ordinal_position;

-- 7. Show columns of user_wardrobe_items (if exists)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_wardrobe_items' 
-- ORDER BY ordinal_position;

-- 8. Sample data from user_wardrobe (if exists and has data)
-- SELECT * FROM user_wardrobe LIMIT 5;

-- 9. Sample data from user_wardrobe_items (if exists and has data)
-- SELECT * FROM user_wardrobe_items LIMIT 5;

