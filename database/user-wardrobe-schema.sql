-- User Wardrobe Schema
-- Stores user's personal wardrobe items with AI analysis

-- User wardrobe items table
CREATE TABLE IF NOT EXISTS user_wardrobe_items (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic product info
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    gallery_urls JSONB DEFAULT '[]'::jsonb,
    
    -- AI Analysis results
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    ai_notes TEXT,
    ai_tags TEXT[] DEFAULT '{}',
    
    -- Product categorization
    category TEXT, -- 'shirt', 'pants', 'jacket', 'shoes', etc.
    subcategory TEXT, -- 'polo', 'dress_shirt', 'jeans', etc.
    brand TEXT,
    color TEXT,
    size TEXT,
    
    -- Style and occasion
    style_tags TEXT[] DEFAULT '{}', -- ['casual', 'formal', 'sporty']
    occasion_tags TEXT[] DEFAULT '{}', -- ['work', 'casual', 'party']
    
    -- Physical properties
    material TEXT,
    fit_type TEXT, -- 'slim', 'regular', 'loose'
    season_suitable TEXT[] DEFAULT '{}', -- ['spring', 'summer', 'fall', 'winter']
    
    -- User preferences
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_worn_at TIMESTAMP WITH TIME ZONE,
    wear_count INTEGER DEFAULT 0,
    
    -- Source tracking
    source_type TEXT DEFAULT 'user_upload', -- 'user_upload', 'ai_analysis', 'manual'
    original_product_id INTEGER REFERENCES products(id), -- If from existing products
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_items_user_id ON user_wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_items_category ON user_wardrobe_items(category);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_items_style_tags ON user_wardrobe_items USING GIN(style_tags);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_items_occasion_tags ON user_wardrobe_items USING GIN(occasion_tags);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_items_ai_tags ON user_wardrobe_items USING GIN(ai_tags);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_items_season ON user_wardrobe_items USING GIN(season_suitable);

-- RLS Policies
ALTER TABLE user_wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own wardrobe items
CREATE POLICY "Users can view own wardrobe items" ON user_wardrobe_items
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own wardrobe items
CREATE POLICY "Users can insert own wardrobe items" ON user_wardrobe_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own wardrobe items
CREATE POLICY "Users can update own wardrobe items" ON user_wardrobe_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own wardrobe items
CREATE POLICY "Users can delete own wardrobe items" ON user_wardrobe_items
    FOR DELETE USING (auth.uid() = user_id);

-- Wardrobe outfits table (for outfit combinations)
CREATE TABLE IF NOT EXISTS user_wardrobe_outfits (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Outfit info
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    
    -- Outfit items
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of wardrobe item IDs
    
    -- AI Analysis
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    ai_notes TEXT,
    
    -- Style and occasion
    style_tags TEXT[] DEFAULT '{}',
    occasion_tags TEXT[] DEFAULT '{}',
    season_suitable TEXT[] DEFAULT '{}',
    
    -- User preferences
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    
    -- Usage tracking
    wear_count INTEGER DEFAULT 0,
    last_worn_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for outfits
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_outfits_user_id ON user_wardrobe_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_outfits_style_tags ON user_wardrobe_outfits USING GIN(style_tags);
CREATE INDEX IF NOT EXISTS idx_user_wardrobe_outfits_occasion_tags ON user_wardrobe_outfits USING GIN(occasion_tags);

-- RLS Policies for outfits
ALTER TABLE user_wardrobe_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wardrobe outfits" ON user_wardrobe_outfits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wardrobe outfits" ON user_wardrobe_outfits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wardrobe outfits" ON user_wardrobe_outfits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wardrobe outfits" ON user_wardrobe_outfits
    FOR DELETE USING (auth.uid() = user_id);

-- Wardrobe analysis history (track AI analysis requests)
CREATE TABLE IF NOT EXISTS wardrobe_analysis_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wardrobe_item_id INTEGER REFERENCES user_wardrobe_items(id) ON DELETE CASCADE,
    
    -- Analysis request
    image_url TEXT NOT NULL,
    user_description TEXT,
    
    -- AI Analysis results
    ai_analysis JSONB NOT NULL,
    ai_confidence DECIMAL(3,2) DEFAULT 0.0,
    
    -- Processing info
    processing_time_ms INTEGER,
    model_used TEXT DEFAULT 'gpt-4o-mini',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analysis history
CREATE INDEX IF NOT EXISTS idx_wardrobe_analysis_history_user_id ON wardrobe_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_analysis_history_item_id ON wardrobe_analysis_history(wardrobe_item_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_analysis_history_created_at ON wardrobe_analysis_history(created_at);

-- RLS Policies for analysis history
ALTER TABLE wardrobe_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis history" ON wardrobe_analysis_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis history" ON wardrobe_analysis_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_wardrobe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_wardrobe_items_updated_at
    BEFORE UPDATE ON user_wardrobe_items
    FOR EACH ROW
    EXECUTE FUNCTION update_wardrobe_updated_at();

CREATE TRIGGER update_user_wardrobe_outfits_updated_at
    BEFORE UPDATE ON user_wardrobe_outfits
    FOR EACH ROW
    EXECUTE FUNCTION update_wardrobe_updated_at();

-- Function to get user's wardrobe summary
CREATE OR REPLACE FUNCTION get_user_wardrobe_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_items', COUNT(*),
        'categories', jsonb_object_agg(
            COALESCE(category, 'uncategorized'), 
            category_count
        ),
        'recent_items', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'title', title,
                    'category', category,
                    'image_url', image_url,
                    'added_at', added_at
                )
            )
            FROM user_wardrobe_items 
            WHERE user_id = p_user_id 
            ORDER BY added_at DESC 
            LIMIT 5
        )
    )
    INTO result
    FROM (
        SELECT 
            category,
            COUNT(*) as category_count
        FROM user_wardrobe_items 
        WHERE user_id = p_user_id 
        GROUP BY category
    ) category_stats;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search wardrobe items
CREATE OR REPLACE FUNCTION search_user_wardrobe(
    p_user_id UUID,
    p_query TEXT DEFAULT '',
    p_category TEXT DEFAULT NULL,
    p_style_tags TEXT[] DEFAULT NULL,
    p_occasion_tags TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id INTEGER,
    title TEXT,
    description TEXT,
    image_url TEXT,
    category TEXT,
    style_tags TEXT[],
    occasion_tags TEXT[],
    ai_notes TEXT,
    user_rating INTEGER,
    added_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.title,
        w.description,
        w.image_url,
        w.category,
        w.style_tags,
        w.occasion_tags,
        w.ai_notes,
        w.user_rating,
        w.added_at
    FROM user_wardrobe_items w
    WHERE w.user_id = p_user_id
        AND (p_query = '' OR w.title ILIKE '%' || p_query || '%' OR w.description ILIKE '%' || p_query || '%')
        AND (p_category IS NULL OR w.category = p_category)
        AND (p_style_tags IS NULL OR w.style_tags && p_style_tags)
        AND (p_occasion_tags IS NULL OR w.occasion_tags && p_occasion_tags)
    ORDER BY w.added_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
