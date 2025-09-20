-- Create user_models table for storing user's AI generated and uploaded models
CREATE TABLE IF NOT EXISTS user_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  style TEXT DEFAULT 'realistic',
  classification JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_models_user_id ON user_models(user_id);
CREATE INDEX IF NOT EXISTS idx_user_models_generated_at ON user_models(generated_at DESC);

-- Enable Row Level Security
ALTER TABLE user_models ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own models" ON user_models
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own models" ON user_models
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own models" ON user_models
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own models" ON user_models
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_models_updated_at 
  BEFORE UPDATE ON user_models 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
