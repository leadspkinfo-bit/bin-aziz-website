-- Sales Processing Officers (SPOs) and the log of every quotation they send.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run (after 015).
--
-- The calculator's "Prepared By" is a pick from this list (no free text, so "Salman" and "salman" can't
-- become two people). Each WhatsApp send / PDF download writes one row to quotation_log, written by the
-- server with the service role key only: nobody can add or change entries from a browser.

create table if not exists public.spos (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(trim(name)) between 1 and 80),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists spos_name_unique on public.spos (lower(trim(name)));

alter table public.spos enable row level security;
-- the calculator lists the active names (names only, nothing else is in the table)
drop policy if exists "Active SPOs are readable" on public.spos;
create policy "Active SPOs are readable" on public.spos for select to anon, authenticated using (active);
drop policy if exists "Admins manage SPOs" on public.spos;
create policy "Admins manage SPOs" on public.spos for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.spos (name) values
  ('Maqsood'),
  ('Hafiz Salman Aziz'),
  ('Shahzaib Afzal'),
  ('Saulat Nawaz Shah'),
  ('Shahzeb Baber'),
  ('Muhammad Bilal'),
  ('Sufyan Amir'),
  ('Kamran Rafiq'),
  ('Suleman Ashraf'),
  ('Abrar'),
  ('Haris Ayyaz'),
  ('Abdullah Hassan'),
  ('Naeem Shah'),
  ('Luqman Bhullar'),
  ('Haji Rafiq')
on conflict do nothing;

create table if not exists public.quotation_log (
  id            uuid primary key default gen_random_uuid(),
  -- the SPO stays linked while they exist; the name is kept as it was, even after a removal
  spo_id        uuid references public.spos (id) on delete set null,
  spo_name      text not null,
  action        text not null check (action in ('whatsapp', 'pdf')),
  client_name   text,
  client_phone  text,
  branch        text,
  package_count int not null,
  summary       text not null,
  grand_total   numeric not null,
  packages_json jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists quotation_log_spo_time on public.quotation_log (spo_id, created_at desc);
create index if not exists quotation_log_time on public.quotation_log (created_at desc);

alter table public.quotation_log enable row level security;
drop policy if exists "Admins read the quotation log" on public.quotation_log;
create policy "Admins read the quotation log" on public.quotation_log for select to authenticated using (public.is_admin());
drop policy if exists "Admins delete from the quotation log" on public.quotation_log;
create policy "Admins delete from the quotation log" on public.quotation_log for delete to authenticated using (public.is_admin());
-- no insert/update policy: only the server (service role) writes entries
