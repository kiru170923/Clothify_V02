-- Clothify Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image_url TEXT,
  provider TEXT DEFAULT 'google',
  provider_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images table for storing try-on results
CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  person_image_url TEXT NOT NULL,
  clothing_image_url TEXT NOT NULL,
  result_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_time INTEGER, -- in milliseconds
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Images policies
CREATE POLICY "Users can view own images" ON images
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own images" ON images
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own images" ON images
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own images" ON images
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('person-images', 'person-images', true),
  ('clothing-images', 'clothing-images', true),
  ('result-images', 'result-images', true);

-- Storage policies
CREATE POLICY "Users can upload person images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'person-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload clothing images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'clothing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload result images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'result-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('person-images', 'clothing-images', 'result-images'));

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (bucket_id IN ('person-images', 'clothing-images', 'result-images') AND auth.role() = 'authenticated');
