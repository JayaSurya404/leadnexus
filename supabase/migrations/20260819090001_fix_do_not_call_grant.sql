-- ============================================================
-- Fix: Grant update permission on do_not_call column
--
-- The do_not_call column was added in migration
-- 20260817120001_voicenexus_secure_delivery.sql
-- but no column-level UPDATE grant was included.
--
-- Without this grant, the authenticated user's
-- updateOwnerLeadStatusAction fails because the
-- column update privilege is missing.
-- ============================================================

grant update (do_not_call)
on public.leads
to authenticated;
