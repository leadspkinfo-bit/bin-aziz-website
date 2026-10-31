-- Inquiries submitted from the website contact form.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.

create table if not exists public.inquiries (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null check (char_length(name) between 2 and 120),
  phone        text not null check (char_length(phone) between 7 and 30),
  email        text check (email is null or char_length(email) <= 160),
  service      text check (service is null or char_length(service) <= 60),
  travellers   int  check (travellers is null or travellers between 1 and 500),
  travel_month text check (travel_month is null or char_length(travel_month) <= 20),
  message      text check (message is null or char_length(message) <= 2000),
  status       text not null default 'new' check (status in ('new', 'contacted', 'closed'))
);

alter table public.inquiries enable row level security;

-- Visitors may only add an inquiry. There is no select/update/delete policy,
-- so nobody can read inquiries with the public key — view them in the
-- Supabase Table Editor (or a future admin panel using a signed-in staff role).
drop policy if exists "Anyone can submit an inquiry" on public.inquiries;
create policy "Anyone can submit an inquiry"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (status = 'new');
