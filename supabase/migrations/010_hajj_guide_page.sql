-- On/off switch for the /hajj-guide page. Starts OFF while the guide is being built.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.

insert into public.site_settings (key, label, grp, enabled, sort_order) values
  ('page_hajj_guide', 'Hajj guide page', 'pages', false, 5)
on conflict (key) do nothing;
