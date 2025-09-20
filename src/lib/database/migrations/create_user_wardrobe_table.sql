-- Create user_wardrobe table for storing user's clothing items
CREATE TABLE IF NOT EXISTS user_wardrobe (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('top', 'bottom', 'dress', 'shoes', 'accessory', 'accessories', 'outerwear')),
  subcategory TEXT NOT NULL,
  color TEXT NOT NULL,
  style TEXT NOT NULL,
  season TEXT DEFAULT 'all-season',
  gender TEXT DEFAULT 'unisex',
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_user_id ON user_wardrobe(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_category ON user_wardrobe(category);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_created_at ON user_wardrobe(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_wardrobe ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own wardrobe items" ON user_wardrobe
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wardrobe items" ON user_wardrobe
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wardrobe items" ON user_wardrobe
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wardrobe items" ON user_wardrobe
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wardrobe_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_wardrobe_updated_at 
  BEFORE UPDATE ON user_wardrobe 
  FOR EACH ROW 
  EXECUTE FUNCTION update_wardrobe_updated_at_column();
