-- Premium packages.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
--
-- `packages` holds the teaser everyone can see.
-- `package_details` holds price, hotels and inclusions — readable only by
-- signed-in users, so locked details never reach a visitor's browser.
-- Add / edit packages in Table Editor; set is_published = false to hide one.

create table if not exists public.packages (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  slug          text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title         text not null,
  category      text not null default 'Umrah',
  tier          text not null default 'Premium',
  duration_days int  check (duration_days is null or duration_days > 0),
  teaser        text not null default '',
  cover_url     text,
  is_published  boolean not null default true,
  sort_order    int not null default 0
);

create table if not exists public.package_details (
  package_id    uuid primary key references public.packages(id) on delete cascade,
  price_text    text,          -- e.g. 'PKR 385,000 per person (quad sharing)'
  makkah_hotel  text,
  madinah_hotel text,
  inclusions    text[] not null default '{}',
  itinerary     text,
  notes         text
);

alter table public.packages enable row level security;
alter table public.package_details enable row level security;

drop policy if exists "Published packages are public" on public.packages;
create policy "Published packages are public"
  on public.packages for select
  to anon, authenticated
  using (is_published);

drop policy if exists "Signed-in users can read details" on public.package_details;
create policy "Signed-in users can read details"
  on public.package_details for select
  to authenticated
  using (exists (select 1 from public.packages p where p.id = package_id and p.is_published));
