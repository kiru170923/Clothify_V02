-- Create task metadata table to store original image URLs for try-on tasks
-- Run this in Supabase SQL Editor

-- Create task_metadata table to store original request data
CREATE TABLE IF NOT EXISTS task_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_image_url TEXT,
  clothing_image_url TEXT,
  clothing_image_urls TEXT[], -- For multiple clothing items
  selected_garment_type TEXT,
  custom_model_prompt TEXT,
  provider TEXT DEFAULT 'kieai',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_metadata_task_id ON task_metadata(task_id);
CREATE INDEX IF NOT EXISTS idx_task_metadata_user_id ON task_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_task_metadata_created_at ON task_metadata(created_at DESC);

-- Enable RLS
ALTER TABLE task_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own task metadata" ON task_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task metadata" ON task_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task metadata" ON task_metadata
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to task metadata" ON task_metadata
  FOR ALL TO service_role USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_task_metadata_updated_at 
  BEFORE UPDATE ON task_metadata
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'task_metadata' 
AND table_schema = 'public'
ORDER BY ordinal_position;
