-- On/off switches for the six parts of the /calculator page (shown on /admin1998).
-- Run in Supabase Dashboard → SQL Editor → New query → Run. Safe to run again (it only adds what is missing).

alter table public.site_settings drop constraint if exists site_settings_grp_check;
alter table public.site_settings
  add constraint site_settings_grp_check check (grp in ('global', 'pages', 'home', 'security', 'calculator'));

insert into public.site_settings (key, label, grp, enabled, sort_order) values
  ('calc_client',   'Client details',       'calculator', true, 1),
  ('calc_ticket',   'Ticket & travellers',  'calculator', true, 2),
  ('calc_makkah',   'Makkah hotels',        'calculator', true, 3),
  ('calc_madina',   'Madina hotels',        'calculator', true, 4),
  ('calc_children', 'Child entries',        'calculator', true, 5),
  ('calc_notes',    'Additional notes',     'calculator', true, 6),
  ('calc_packages', 'Packages, buttons & grand total', 'calculator', true, 7)
on conflict (key) do nothing;
