-- Enhanced Wardrobe Analysis Schema
-- Run this in Supabase SQL editor

-- Table for wardrobe analysis summary
CREATE TABLE IF NOT EXISTS wardrobe_analysis_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_items INTEGER DEFAULT 0,
  style_diversity VARCHAR(50), -- 'đa dạng', 'hạn chế', 'chuyên biệt'
  color_palette TEXT[], -- Array of colors
  missing_categories TEXT[], -- Array of missing categories
  strengths TEXT[], -- Array of strengths
  recommendations TEXT[], -- Array of recommendations
  analysis_notes TEXT,
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enhanced user_wardrobe_items table (if not exists)
CREATE TABLE IF NOT EXISTS user_wardrobe_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  color VARCHAR(50),
  colors TEXT[], -- Array of all colors
  materials TEXT[], -- Array of materials
  patterns TEXT[], -- Array of patterns
  fit_type VARCHAR(50), -- slim, regular, loose, oversized
  style_tags TEXT[], -- Array of style tags
  occasion_tags TEXT[], -- Array of occasion tags
  season_tags TEXT[], -- Array of season tags
  brand VARCHAR(100),
  size_estimate VARCHAR(20),
  condition VARCHAR(50), -- new, used, old
  ai_notes TEXT,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  analysis_source VARCHAR(50), -- 'image_analysis', 'manual', 'import'
  image_url TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wardrobe_analysis_user_id ON wardrobe_analysis_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON user_wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_category ON user_wardrobe_items(category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_color ON user_wardrobe_items(color);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_added_at ON user_wardrobe_items(added_at);

-- RLS Policies
ALTER TABLE wardrobe_analysis_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own wardrobe analysis
CREATE POLICY "Users can view own wardrobe analysis" ON wardrobe_analysis_summary
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can manage their own wardrobe analysis
CREATE POLICY "Users can manage own wardrobe analysis" ON wardrobe_analysis_summary
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Users can only see their own wardrobe items
CREATE POLICY "Users can view own wardrobe items" ON user_wardrobe_items
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can manage their own wardrobe items
CREATE POLICY "Users can manage own wardrobe items" ON user_wardrobe_items
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Service role can manage all wardrobe data
CREATE POLICY "Service role can manage wardrobe analysis" ON wardrobe_analysis_summary
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage wardrobe items" ON user_wardrobe_items
  FOR ALL USING (auth.role() = 'service_role');

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wardrobe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_wardrobe_analysis_updated_at
  BEFORE UPDATE ON wardrobe_analysis_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_wardrobe_updated_at();

CREATE TRIGGER update_wardrobe_items_updated_at
  BEFORE UPDATE ON user_wardrobe_items
  FOR EACH ROW
  EXECUTE FUNCTION update_wardrobe_updated_at();

-- Function: Get user wardrobe summary
CREATE OR REPLACE FUNCTION get_user_wardrobe_summary(user_uuid UUID)
RETURNS TABLE (
  total_items BIGINT,
  categories JSONB,
  colors JSONB,
  styles JSONB,
  occasions JSONB,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_items,
    jsonb_object_agg(category, category_count) as categories,
    jsonb_object_agg(color, color_count) as colors,
    jsonb_object_agg(style_tag, style_count) as styles,
    jsonb_object_agg(occasion_tag, occasion_count) as occasions,
    MAX(added_at) as last_updated
  FROM (
    SELECT 
      category,
      COUNT(*) as category_count
    FROM user_wardrobe_items 
    WHERE user_id = user_uuid AND category IS NOT NULL
    GROUP BY category
  ) cat
  FULL OUTER JOIN (
    SELECT 
      color,
      COUNT(*) as color_count
    FROM user_wardrobe_items 
    WHERE user_id = user_uuid AND color IS NOT NULL
    GROUP BY color
  ) col ON true
  FULL OUTER JOIN (
    SELECT 
      unnest(style_tags) as style_tag,
      COUNT(*) as style_count
    FROM user_wardrobe_items 
    WHERE user_id = user_uuid AND style_tags IS NOT NULL
    GROUP BY style_tag
  ) sty ON true
  FULL OUTER JOIN (
    SELECT 
      unnest(occasion_tags) as occasion_tag,
      COUNT(*) as occasion_count
    FROM user_wardrobe_items 
    WHERE user_id = user_uuid AND occasion_tags IS NOT NULL
    GROUP BY occasion_tag
  ) occ ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE wardrobe_analysis_summary IS 'Stores AI analysis summary of user wardrobe';
COMMENT ON TABLE user_wardrobe_items IS 'Stores individual wardrobe items with detailed analysis';
COMMENT ON FUNCTION get_user_wardrobe_summary IS 'Returns aggregated wardrobe statistics for a user';
