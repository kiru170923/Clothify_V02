-- user-profile-schema.sql
-- Idempotent migration: create user_profiles table, policies, and ensure storage bucket for user photos.

-- 1) Table
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  gender text,
  age_group text,
  height_cm int,
  weight_kg int,
  size text,
  style_preferences text[] default '{}',
  favorite_colors text[] default '{}',
  occasions text[] default '{}',
  budget_range text,
  try_on_photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Enable RLS if table exists
do $$
begin
  if exists (
    select 1 from pg_tables where schemaname='public' and tablename='user_profiles'
  ) then
    execute 'alter table public.user_profiles enable row level security';
  end if;
end $$;

-- 3) Policies (create if missing)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='select own profile'
  ) then
    create policy "select own profile"
    on public.user_profiles for select
    to authenticated
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='upsert own profile'
  ) then
    create policy "upsert own profile"
    on public.user_profiles for insert
    to authenticated
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='update own profile'
  ) then
    create policy "update own profile"
    on public.user_profiles for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end $$;

-- 4) Storage bucket for user photos (public)
insert into storage.buckets (id, name, public)
select 'user-photos','user-photos', true
where not exists (select 1 from storage.buckets where id='user-photos');

-- Optional: public read policy if bucket not public (commented)
-- create policy "public read user-photos"
-- on storage.objects for select
-- to public
-- using (bucket_id = 'user-photos');

-- 5) Helper function to increment tokens safely (idempotent create)
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where p.proname = 'increment_user_tokens' and n.nspname = 'public'
  ) then
    create or replace function public.increment_user_tokens(p_user_id uuid, p_tokens int)
    returns void
    language plpgsql
    as $$
    begin
      update user_tokens
      set total_tokens = coalesce(total_tokens,0) + p_tokens
      where user_id = p_user_id;
    end;
    $$;
  end if;
end $$;

-- END

