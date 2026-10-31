-- Gives the scrolling 3D ticket its own switch (starts OFF).
-- The existing three_d switch now controls only the 3D fleet, so its label is updated.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.

insert into public.site_settings (key, label, grp, enabled, sort_order) values
  ('ticket_3d', '3D scrolling ticket', 'home', false, 0)
on conflict (key) do nothing;

update public.site_settings set label = '3D fleet' where key = 'three_d';
