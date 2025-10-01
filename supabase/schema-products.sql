-- Enable pgvector (run once)
create extension if not exists vector;

-- Main products table
create table if not exists products (
  id                bigint primary key,
  title             text not null,
  handle            text,
  url               text not null,
  image             text,
  gallery           text[] default '{}',
  price             integer not null,
  compare_at_price  integer,
  vendor            text,
  tags              text[] default '{}',
  created_at        timestamptz,
  description_text  text,
  tabs              jsonb,
  variants          jsonb default '[]'::jsonb,
  style             text[] default '{}',
  occasion          text[] default '{}',
  match_with        text[] default '{}',
  why_recommend     text,
  search_booster    text,
  updated_at        timestamptz default now()
);

create index if not exists products_created_at_idx on products (created_at desc nulls last);
create index if not exists products_tags_idx on products using gin (tags);

-- Chunk embeddings table
create table if not exists product_embeddings (
  id           bigserial primary key,
  product_id   bigint references products(id) on delete cascade,
  chunk_kind   text check (chunk_kind in ('overview','features','variants','policy')),
  content      text not null,
  embedding    vector(1536)
);

create index if not exists product_embeddings_product_idx on product_embeddings (product_id);
create index if not exists product_embeddings_embedding_idx on product_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Similarity RPC
create or replace function match_products(
  query_embedding vector(1536),
  match_count int default 8
)
returns table (
  product_id bigint,
  chunk_kind text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    pe.product_id,
    pe.chunk_kind,
    pe.content,
    1 - (pe.embedding <-> query_embedding) as similarity
  from product_embeddings pe
  order by pe.embedding <-> query_embedding
  limit match_count;
$$;
