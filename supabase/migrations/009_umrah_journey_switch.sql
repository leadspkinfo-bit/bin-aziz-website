-- Admin switches for the Umrah guide: the whole page, and the journey section on it (both start ON).
-- Safe to run even if 008 was already run. Run once in Supabase Dashboard → SQL Editor → New query → Run.

insert into public.site_settings (key, label, grp, enabled, sort_order) values
  ('page_umrah_guide', 'Umrah guide page', 'pages', true, 3),
  ('umrah_journey', 'Umrah guide — journey section', 'pages', true, 4)
on conflict (key) do nothing;
