-- Quotations are no longer shared by link (user request 2026-11-03): clients get the WhatsApp text and a
-- PDF the staff send themselves. get_quotation() let anyone holding a quotation id read the whole row,
-- including the internal costs and profit in results_json, so it is removed. Admins still read
-- quotations through the table's own policy ("Admins manage quotations").
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run.

drop function if exists public.get_quotation(uuid);