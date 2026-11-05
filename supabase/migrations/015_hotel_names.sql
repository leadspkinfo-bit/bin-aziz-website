-- Hotel name memory for the AI rate scan, and merging of a hotel stored twice under two spellings.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run (after 014).
--
-- Rate lists from different suppliers spell one hotel differently ("SNOOD MOWWTAN" / "SNOOD MOWTAN") or
-- print two hotels in one row ("MELLA 1/MELLA 2"). The scan maps such names onto the stored hotel by
-- itself; when it is not sure it asks the admin once, and the answer is kept here so it never asks again.

create table if not exists public.hotel_aliases (
  id         uuid primary key default gen_random_uuid(),
  city       text not null check (city in ('makkah', 'madina')),
  alias      text not null,
  -- the stored hotel's name this spelling means; null = "a different hotel" (don't ask again)
  target     text,
  created_at timestamptz not null default now(),
  unique (city, alias)
);

alter table public.hotel_aliases enable row level security;
drop policy if exists "Admins manage hotel aliases" on public.hotel_aliases;
create policy "Admins manage hotel aliases"
  on public.hotel_aliases for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Moves every rate of `drop_id` onto each hotel in `keep_ids` (a rate the kept hotel already has for the
-- same period and room stays as it is), then deletes `drop_id`. One transaction.
-- One kept hotel = two spellings of the same hotel; two kept hotels = an "A/B" row split into both.
create or replace function public.merge_hotels(drop_id uuid, keep_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  keep uuid;
  drop_city text;
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  select city into drop_city from hotels where id = drop_id;
  if drop_city is null then
    raise exception 'Hotel not found';
  end if;
  if drop_id = any (keep_ids) or exists (select 1 from hotels where id = any (keep_ids) and city <> drop_city) then
    raise exception 'Hotels must be different and in the same city';
  end if;
  foreach keep in array keep_ids loop
    insert into hotel_rates (hotel_id, season_id, room_type, rate_sar)
    select keep, season_id, room_type, rate_sar from hotel_rates where hotel_id = drop_id
    on conflict (hotel_id, season_id, room_type) do nothing;
  end loop;
  delete from hotels where id = drop_id;
end;
$$;
revoke all on function public.merge_hotels(uuid, uuid[]) from public;
grant execute on function public.merge_hotels(uuid, uuid[]) to authenticated, service_role;
