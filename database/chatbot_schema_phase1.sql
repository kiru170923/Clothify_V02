-- Chatbot Phase 1: Basic DB schema for product search and conversations
-- Run in Supabase SQL editor. Idempotent safety included.

-- Ensure uuid support
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Products table: store raw + normalized data
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_site text,
  source_url text,
  source_id text,
  title text,
  price bigint,
  original_price bigint,
  currency text DEFAULT 'VND',
  images jsonb,
  colors text[],
  sizes text[],
  stock jsonb,
  raw_markdown text,
  raw_html text,
  metadata jsonb,
  normalized jsonb, -- normalized product schema for fast queries
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversations: store user-bot exchanges for personalization and training
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  messages jsonb, -- array of {role, content, metadata}
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recommendations record: store recommended product lists per conversation
CREATE TABLE IF NOT EXISTS public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  conversation_id uuid,
  recommended_products jsonb, -- array of product ids and scores
  reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Optional simple FTS column for products (can be materialized or updated by trigger)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.products'::regclass AND attname = 'search_vector') THEN
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_vector tsvector;
  END IF;
END$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.products;
CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_conv ON public.conversations;
CREATE TRIGGER trg_set_updated_at_conv
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- Note: Phase 1 focuses on schema. Later phases will add FTS indexing,
-- normalization functions, materialized views and RBAC policies.


