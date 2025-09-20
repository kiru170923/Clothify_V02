-- Add classification column to user_models table
ALTER TABLE user_models 
ADD COLUMN IF NOT EXISTS classification JSONB;

-- Add index for classification queries
CREATE INDEX IF NOT EXISTS idx_user_models_classification ON user_models USING GIN (classification);

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_user_models_category ON user_models ((classification->>'category'));
