-- Admin panel: on/off switches for the website.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Then add your admin email (kept out of this file on purpose):
--   insert into public.admins (email) values ('you@example.com');

-- Who is an admin. No RLS policies = nobody can read or change this table
-- through the API; only is_admin() (security definer) looks inside.
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where email = lower(auth.jwt() ->> 'email'));
$$;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.site_settings (
  key        text primary key,
  label      text not null,
  grp        text not null check (grp in ('global', 'pages', 'home', 'security')),
  enabled    boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

drop policy if exists "Settings are public" on public.site_settings;
create policy "Settings are public"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can change settings" on public.site_settings;
create policy "Admins can change settings"
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.site_settings (key, label, grp, enabled, sort_order) values
  ('site_enabled',      'Entire website',            'global',   true,  0),
  ('page_about',        'About page',                'pages',    true,  1),
  ('page_services',     'Services pages',            'pages',    true,  2),
  ('page_packages',     'Premium packages',          'pages',    true,  3),
  ('page_membership',   'Become a Member',           'pages',    true,  4),
  ('page_contact',      'Contact page',              'pages',    true,  5),
  ('page_signup',       'Sign up / Log in',          'pages',    true,  6),
  ('home_intro',        'Introduction',              'home',     true,  1),
  ('home_services',     'Services',                  'home',     true,  2),
  ('home_fleet',        'Our fleet',                 'home',     true,  3),
  ('home_achievements', 'Key achievements',          'home',     true,  4),
  ('home_principles',   'Our motive',                'home',     true,  5),
  ('home_cta',          'Plan your Umrah banner',    'home',     true,  6),
  ('whatsapp_button',   'Floating WhatsApp button',  'home',     true,  7),
  ('block_inspect',     'Block right-click & Inspect shortcuts', 'security', false, 1)
on conflict (key) do nothing;
