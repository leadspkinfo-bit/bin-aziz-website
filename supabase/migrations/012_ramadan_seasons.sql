-- The calculator's four fixed seasons. AI scans sort every rate list date into one of these.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run (after 011).

update public.seasons set sort_order = sort_order + 100
where name not in ('Before Ramadan', '1st Ashra Ramadan', 'Mid Ashra Ramadan', 'Last Ashra Ramadan');

insert into public.seasons (name, sort_order) values
  ('Before Ramadan', 1),
  ('1st Ashra Ramadan', 2),
  ('Mid Ashra Ramadan', 3),
  ('Last Ashra Ramadan', 4)
on conflict (name) do update set sort_order = excluded.sort_order;
