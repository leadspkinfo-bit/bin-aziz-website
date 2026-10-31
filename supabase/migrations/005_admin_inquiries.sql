-- Let admins read and manage contact-form inquiries from the admin panel.
-- Run once in Supabase Dashboard → SQL Editor → New query → Run
-- (after 001_inquiries.sql and 004_admin_settings.sql).
-- Visitors can still only insert; nobody else can read them.

drop policy if exists "Admins can read inquiries" on public.inquiries;
create policy "Admins can read inquiries"
  on public.inquiries for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update inquiries" on public.inquiries;
create policy "Admins can update inquiries"
  on public.inquiries for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete inquiries" on public.inquiries;
create policy "Admins can delete inquiries"
  on public.inquiries for delete
  to authenticated
  using (public.is_admin());

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
