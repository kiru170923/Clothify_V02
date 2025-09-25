-- Phase 4: Full Text Search support for products
-- Adds search_vector, trigger, GIN index and a product_search RPC

-- Ensure pg_trgm and unaccent available for better matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Add search_vector column if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.products'::regclass AND attname = 'search_vector') THEN
    ALTER TABLE public.products ADD COLUMN search_vector tsvector;
  END IF;
END$$;

-- Function to update tsvector
CREATE OR REPLACE FUNCTION public.products_search_vector_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.normalized->> 'title','')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.normalized->> 'description','')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.normalized->> 'images','')), 'C');
  RETURN NEW;
END;
$$;

-- Trigger to keep search_vector up-to-date
DROP TRIGGER IF EXISTS trg_products_search_vector ON public.products;
CREATE TRIGGER trg_products_search_vector
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE PROCEDURE public.products_search_vector_update();

-- GIN index for fast full-text search and trigram for fuzzy matching on title
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON public.products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON public.products USING gin ((coalesce(normalized->>'title','')) gin_trgm_ops);

-- RPC for searching products with ranking and basic filters
CREATE OR REPLACE FUNCTION public.product_search(
  p_query text,
  p_price_min bigint DEFAULT NULL,
  p_price_max bigint DEFAULT NULL,
  p_color text DEFAULT NULL,
  p_size text DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
) RETURNS TABLE(id uuid, source_url text, title text, price bigint, normalized jsonb, rank double precision) LANGUAGE sql AS $$
  SELECT p.id, p.source_url, (p.normalized->>'title')::text as title, p.price, p.normalized,
    ts_rank(p.search_vector, plainto_tsquery('simple', coalesce(p_query,''))) AS rank
  FROM public.products p
  WHERE (
    p_query IS NULL OR p_query = '' OR p.search_vector @@ plainto_tsquery('simple', p_query)
    OR coalesce(p.normalized->>'title','') ILIKE ('%' || p_query || '%')
  )
  AND (p_price_min IS NULL OR p.price >= p_price_min)
  AND (p_price_max IS NULL OR p.price <= p_price_max)
  /* simple color/size contains checks */
  AND (p_color IS NULL OR (p.normalized->'colors')::text ILIKE ('%' || p_color || '%'))
  AND (p_size IS NULL OR (p.normalized->'sizes')::text ILIKE ('%' || p_size || '%'))
  ORDER BY rank DESC NULLS LAST, p.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- Note: This RPC returns rows; count can be requested with a separate COUNT query if needed.


