-- Umrah quotation calculator and rate management.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Rates are public to read and only admins (public.is_admin()) can change them.
-- Saved quotations hold client names and phone numbers, so nobody reads the table directly:
-- the shareable link goes through get_quotation(id), which returns one row for a known id.

create table if not exists public.seasons (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.hotels (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  city       text not null check (city in ('makkah', 'madina')),
  location   text not null default '-',
  slug       text not null,
  created_at timestamptz not null default now(),
  unique (city, slug)
);

create table if not exists public.hotel_rates (
  id        uuid primary key default gen_random_uuid(),
  hotel_id  uuid not null references public.hotels (id) on delete cascade,
  season_id uuid not null references public.seasons (id) on delete cascade,
  room_type text not null check (room_type in ('sharing', 'quint', 'quad', 'triple', 'double')),
  rate_sar  numeric not null default 0,
  unique (hotel_id, season_id, room_type)
);
create index if not exists hotel_rates_hotel_idx on public.hotel_rates (hotel_id);
create index if not exists hotel_rates_season_idx on public.hotel_rates (season_id);

create table if not exists public.visa_rates (
  id             uuid primary key default gen_random_uuid(),
  transport_type text not null check (transport_type in ('bus', 'private')),
  pax            int not null,
  rate_sar       numeric not null,
  unique (transport_type, pax)
);

-- public.site_settings already holds the website's on/off switches; these are numbers.
create table if not exists public.rate_settings (
  key        text primary key,
  value      numeric not null,
  updated_at timestamptz not null default now()
);
insert into public.rate_settings (key, value) values
  ('profit_pkr', 20000),
  ('ziyarat_makkah_sar', 10),
  ('ziyarat_madina_sar', 10),
  ('sar_to_pkr', 78),
  ('infant_price_pkr', 95000)
on conflict (key) do nothing;

create table if not exists public.quotations (
  id            uuid primary key default gen_random_uuid(),
  family_head   text,
  contact_no    text,
  branch        text,
  prepared_by   text,
  season        text,
  notes         text,
  packages_json jsonb not null,
  results_json  jsonb not null,
  grand_total   numeric not null,
  created_at    timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['seasons', 'hotels', 'hotel_rates', 'visa_rates', 'rate_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Rates are public" on public.%I', t);
    execute format('create policy "Rates are public" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "Admins manage rates" on public.%I', t);
    execute format('create policy "Admins manage rates" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

alter table public.quotations enable row level security;
drop policy if exists "Admins manage quotations" on public.quotations;
create policy "Admins manage quotations"
  on public.quotations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.get_quotation(quotation_id uuid)
returns setof public.quotations
language sql
stable
security definer
set search_path = public
as $$
  select * from public.quotations where id = quotation_id;
$$;
revoke all on function public.get_quotation(uuid) from public;
grant execute on function public.get_quotation(uuid) to anon, authenticated;

-- Writes one AI scan or import in a single transaction. profit_pkr, sar_to_pkr and
-- infant_price_pkr are never touched. Replace mode only clears a city or transport type
-- that this payload actually contains.
create or replace function public.apply_scan(payload jsonb, mode text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  city_name text;
  city_rows jsonb;
  hotel jsonb;
  rate jsonb;
  room text;
  hotel_uuid uuid;
  season_uuid uuid;
  period text;
  transport text;
  visa_rows jsonb;
  visa jsonb;
  next_order int;
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if mode not in ('replace', 'merge') then
    raise exception 'Unknown mode %', mode;
  end if;

  select coalesce(max(sort_order), 0) into next_order from seasons;
  for period in select jsonb_array_elements_text(coalesce(payload -> 'periods', '[]'::jsonb)) loop
    next_order := next_order + 1;
    insert into seasons (name, sort_order) values (period, next_order) on conflict (name) do nothing;
  end loop;

  foreach city_name in array array['makkah', 'madina'] loop
    city_rows := coalesce(payload -> city_name, '[]'::jsonb);
    if jsonb_array_length(city_rows) = 0 then
      continue;
    end if;
    if mode = 'replace' then
      delete from hotels where city = city_name;
    end if;

    for hotel in select * from jsonb_array_elements(city_rows) loop
      insert into hotels (name, city, location, slug)
      values (
        hotel ->> 'name',
        city_name,
        coalesce(nullif(hotel ->> 'location', ''), '-'),
        regexp_replace(lower(trim(hotel ->> 'name')), '[^a-z0-9]+', '_', 'g')
      )
      on conflict (city, slug) do update set name = excluded.name, location = excluded.location
      returning id into hotel_uuid;

      for rate in select * from jsonb_array_elements(coalesce(hotel -> 'rates', '[]'::jsonb)) loop
        next_order := next_order + 1;
        insert into seasons (name, sort_order) values (rate ->> 'period', next_order) on conflict (name) do nothing;
        select id into season_uuid from seasons where name = rate ->> 'period';
        foreach room in array array['sharing', 'quint', 'quad', 'triple', 'double'] loop
          insert into hotel_rates (hotel_id, season_id, room_type, rate_sar)
          values (hotel_uuid, season_uuid, room, coalesce((rate ->> room)::numeric, 0))
          on conflict (hotel_id, season_id, room_type) do update set rate_sar = excluded.rate_sar;
        end loop;
      end loop;
    end loop;
  end loop;

  foreach transport in array array['bus', 'private'] loop
    visa_rows := coalesce(payload -> (case transport when 'bus' then 'visaBus' else 'visaPrivate' end), '[]'::jsonb);
    if jsonb_array_length(visa_rows) = 0 then
      continue;
    end if;
    if mode = 'replace' then
      delete from visa_rates where transport_type = transport;
    end if;
    for visa in select * from jsonb_array_elements(visa_rows) loop
      insert into visa_rates (transport_type, pax, rate_sar)
      values (transport, (visa ->> 'pax')::int, (visa ->> 'rate')::numeric)
      on conflict (transport_type, pax) do update set rate_sar = excluded.rate_sar;
    end loop;
  end loop;

  if coalesce((payload #>> '{ziyarat,makkah}')::numeric, 0) > 0 then
    update rate_settings set value = (payload #>> '{ziyarat,makkah}')::numeric, updated_at = now() where key = 'ziyarat_makkah_sar';
  end if;
  if coalesce((payload #>> '{ziyarat,madina}')::numeric, 0) > 0 then
    update rate_settings set value = (payload #>> '{ziyarat,madina}')::numeric, updated_at = now() where key = 'ziyarat_madina_sar';
  end if;

  return jsonb_build_object(
    'makkahWritten', jsonb_array_length(coalesce(payload -> 'makkah', '[]'::jsonb)),
    'madinaWritten', jsonb_array_length(coalesce(payload -> 'madina', '[]'::jsonb)),
    'visaBus', jsonb_array_length(coalesce(payload -> 'visaBus', '[]'::jsonb)),
    'visaPrivate', jsonb_array_length(coalesce(payload -> 'visaPrivate', '[]'::jsonb))
  );
end;
$$;
revoke all on function public.apply_scan(jsonb, text) from public;
grant execute on function public.apply_scan(jsonb, text) to authenticated, service_role;

-- Stays off until the rate lists are loaded.
insert into public.site_settings (key, label, grp, enabled, sort_order) values
  ('page_calculator', 'Umrah calculator', 'pages', false, 6)
on conflict (key) do nothing;
