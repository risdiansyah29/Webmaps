-- Minimal Supabase schema for this app (locations, reviews, favorites)
-- Run in Supabase SQL editor.

-- Extensions
create extension if not exists "uuid-ossp";

-- LOCATIONS
create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  region text not null,
  address text not null,
  description text not null,
  rating numeric not null default 0,
  image text not null,
  lat double precision not null,
  lng double precision not null,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

-- REVIEWS
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid not null references public.locations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

-- FAVORITES
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, location_id)
);

-- Indexes
create index if not exists idx_reviews_location_id on public.reviews(location_id);
create index if not exists idx_favorites_user_id on public.favorites(user_id);

-- RLS
alter table public.locations enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;

-- locations: public read
drop policy if exists "locations_read" on public.locations;
create policy "locations_read"
on public.locations for select
to anon, authenticated
using (true);

-- reviews: public read, auth write
drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read"
on public.reviews for select
to anon, authenticated
using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
on public.reviews for insert
to authenticated
with check (auth.uid() = user_id);

-- favorites: only owner can read/write
drop policy if exists "favorites_read_own" on public.favorites;
create policy "favorites_read_own"
on public.favorites for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "favorites_write_own" on public.favorites;
create policy "favorites_write_own"
on public.favorites for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites for delete
to authenticated
using (auth.uid() = user_id);
