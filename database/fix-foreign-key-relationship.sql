-- Fix foreign key relationship between user_memberships and membership_plans
-- Run this in Supabase SQL Editor

-- First, clean up invalid plan_id references
UPDATE user_memberships 
SET plan_id = NULL 
WHERE plan_id NOT IN (SELECT id FROM membership_plans);

-- Delete user_memberships with invalid plan_id (optional - uncomment if needed)
-- DELETE FROM user_memberships 
-- WHERE plan_id NOT IN (SELECT id FROM membership_plans);

-- Check if the foreign key constraint exists
-- If not, add it
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_memberships_plan_id_fkey'
        AND table_name = 'user_memberships'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE user_memberships 
        ADD CONSTRAINT user_memberships_plan_id_fkey 
        FOREIGN KEY (plan_id) REFERENCES membership_plans(id);
        
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Verify the relationship works
SELECT 
    um.id,
    um.user_id,
    um.plan_id,
    mp.name as plan_name,
    mp.tokens_monthly,
    mp.tokens_yearly
FROM user_memberships um
LEFT JOIN membership_plans mp ON um.plan_id = mp.id
LIMIT 5;
