-- ============================================================
-- LeadNexus
-- Phase 16: Runtime tracking alignment
-- ============================================================
--
-- Public visitor sessions use a browser-generated anonymous
-- identifier so LeadNexus can recognize return visitors
-- without requiring an account.
--
-- activity_events continues to use the canonical session_id
-- foreign key defined in the original schema.
-- ============================================================


alter table public.visitor_sessions
  add column if not exists anonymous_id text;


create index if not exists
  visitor_sessions_business_anonymous_idx
on public.visitor_sessions (
  business_id,
  anonymous_id
);


comment on column
  public.visitor_sessions.anonymous_id
is
  'Browser-generated anonymous LeadNexus visitor identifier. This is not an authenticated user ID.';