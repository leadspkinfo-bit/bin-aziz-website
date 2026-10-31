-- Adds the admin switch for the 3D look (floating 3D ticket + interactive 3D fleet).
-- Off = the plain look. Run once in Supabase Dashboard → SQL Editor → New query → Run.

insert into public.site_settings (key, label, grp, enabled, sort_order) values
  ('three_d', '3D ticket & 3D fleet', 'home', false, 0)
on conflict (key) do nothing;
