-- On/off switch for the new /umrah-guide page (starts ON).
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.

insert into public.site_settings (key, label, grp, enabled, sort_order) values
  ('page_umrah_guide', 'Umrah guide page', 'pages', true, 3)
on conflict (key) do nothing;
