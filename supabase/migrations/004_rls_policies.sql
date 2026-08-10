-- ============================================================
-- LeadNexus
-- Migration: 004_rls_policies.sql
--
-- Purpose:
--   Complete Row Level Security and database privileges for
--   the LeadNexus MVP.
--
-- SECURITY MODEL
--
--   PLATFORM ADMIN
--   ----------------------------------------------------------
--   Can read all businesses, leads, visitor activity,
--   intelligence and recovery information.
--
--
--   BUSINESS OWNER / MANAGER
--   ----------------------------------------------------------
--   Can manage only businesses they belong to.
--
--   Can see only leads where:
--
--       visibility = OWNER_VISIBLE
--
--   Cannot see ADMIN_ONLY leads.
--
--   Cannot browse anonymous visitor sessions.
--
--   Can see activity only for owner-visible identified leads.
--
--
--   PUBLIC LEAD / ANONYMOUS VISITOR
--   ----------------------------------------------------------
--   Has NO direct Data API table access.
--
--   Public operations go through validated Next.js
--   server-side Route Handlers using the server-only
--   Supabase secret client.
--
--
-- IMPORTANT:
--
--   RLS controls rows.
--
--   PostgreSQL grants below also control which operations and
--   columns authenticated users are allowed to modify.
--
-- ============================================================


-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles
  enable row level security;

alter table public.businesses
  enable row level security;

alter table public.business_members
  enable row level security;

alter table public.business_social_links
  enable row level security;

alter table public.business_hours
  enable row level security;

alter table public.products
  enable row level security;

alter table public.contact_templates
  enable row level security;

alter table public.public_page_settings
  enable row level security;

alter table public.lead_form_settings
  enable row level security;

alter table public.tracking_links
  enable row level security;

alter table public.visitor_sessions
  enable row level security;

alter table public.leads
  enable row level security;

alter table public.activity_events
  enable row level security;

alter table public.lead_notes
  enable row level security;

alter table public.lead_status_history
  enable row level security;

alter table public.lead_intelligence
  enable row level security;

alter table public.lead_recovery_reviews
  enable row level security;

alter table public.seo_settings
  enable row level security;

alter table public.integration_connections
  enable row level security;

alter table public.outbox_events
  enable row level security;

alter table public.audit_logs
  enable row level security;


-- ============================================================
-- OWNER-VISIBLE LEAD HELPER
--
-- Used by child tables such as:
--
--   activity_events
--   lead_notes
--   lead_status_history
--   lead_intelligence
--
-- SECURITY DEFINER prevents recursive RLS evaluation while
-- exposing only a boolean answer.
-- ============================================================

create or replace function public.can_view_owner_visible_lead(
  target_lead_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.leads as lead
    where
      lead.id = target_lead_id

      and lead.visibility = 'OWNER_VISIBLE'

      and lead.archived_at is null

      and public.is_business_member(
        lead.business_id
      )
  );
$$;


revoke execute
on function public.can_view_owner_visible_lead(uuid)
from public, anon;


grant execute
on function public.can_view_owner_visible_lead(uuid)
to authenticated;


comment on function public.can_view_owner_visible_lead(uuid) is
  'Returns whether the authenticated business user can access an OWNER_VISIBLE LeadNexus lead.';


-- ============================================================
-- REMOVE DEFAULT DATA API PERMISSIONS
--
-- We start from least privilege and explicitly add back only
-- the operations required by the authenticated application.
--
-- Anonymous users receive NO direct access to LeadNexus tables.
-- ============================================================

revoke all privileges
on table
  public.profiles,
  public.businesses,
  public.business_members,
  public.business_social_links,
  public.business_hours,
  public.products,
  public.contact_templates,
  public.public_page_settings,
  public.lead_form_settings,
  public.tracking_links,
  public.visitor_sessions,
  public.leads,
  public.activity_events,
  public.lead_notes,
  public.lead_status_history,
  public.lead_intelligence,
  public.lead_recovery_reviews,
  public.seo_settings,
  public.integration_connections,
  public.outbox_events,
  public.audit_logs
from anon;


revoke all privileges
on table
  public.profiles,
  public.businesses,
  public.business_members,
  public.business_social_links,
  public.business_hours,
  public.products,
  public.contact_templates,
  public.public_page_settings,
  public.lead_form_settings,
  public.tracking_links,
  public.visitor_sessions,
  public.leads,
  public.activity_events,
  public.lead_notes,
  public.lead_status_history,
  public.lead_intelligence,
  public.lead_recovery_reviews,
  public.seo_settings,
  public.integration_connections,
  public.outbox_events,
  public.audit_logs
from authenticated;


-- ============================================================
-- AUTHENTICATED PRIVILEGES
-- ============================================================


-- ------------------------------------------------------------
-- PROFILES
--
-- Users may update only their normal profile fields.
--
-- They CANNOT directly update:
--
--   platform_role
--
-- Therefore a normal authenticated user cannot promote
-- themselves to PLATFORM_ADMIN.
-- ------------------------------------------------------------

grant select
on public.profiles
to authenticated;


grant update (
  full_name,
  phone,
  avatar_url
)
on public.profiles
to authenticated;


-- ------------------------------------------------------------
-- BUSINESSES
--
-- authenticated user may create their own business.
--
-- Update permissions deliberately exclude:
--
--   id
--   created_by
--   created_at
--
-- ------------------------------------------------------------

grant select, insert
on public.businesses
to authenticated;


grant update (
  name,
  slug,
  category,
  business_type,
  description,
  business_email,
  business_phone,
  whatsapp_number,
  website,
  address_line_1,
  address_line_2,
  city,
  state,
  country,
  postal_code,
  service_area,
  logo_url,
  cover_url,
  status,
  onboarding_step,
  onboarding_completed_at,
  archived_at
)
on public.businesses
to authenticated;


-- ------------------------------------------------------------
-- BUSINESS MEMBERS
--
-- MVP membership creation is handled through trusted database
-- logic/server logic.
--
-- Direct clients receive read-only membership access.
-- ------------------------------------------------------------

grant select
on public.business_members
to authenticated;


-- ------------------------------------------------------------
-- SOCIAL LINKS
-- ------------------------------------------------------------

grant
  select,
  insert,
  update,
  delete
on public.business_social_links
to authenticated;


-- ------------------------------------------------------------
-- BUSINESS HOURS
-- ------------------------------------------------------------

grant
  select,
  insert,
  update,
  delete
on public.business_hours
to authenticated;


-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------

grant
  select,
  insert,
  update,
  delete
on public.products
to authenticated;


-- ------------------------------------------------------------
-- CONTACT TEMPLATES
-- ------------------------------------------------------------

grant
  select,
  insert,
  update,
  delete
on public.contact_templates
to authenticated;


-- ------------------------------------------------------------
-- PUBLIC PAGE SETTINGS
-- ------------------------------------------------------------

grant
  select,
  update
on public.public_page_settings
to authenticated;


-- ------------------------------------------------------------
-- LEAD FORM SETTINGS
-- ------------------------------------------------------------

grant
  select,
  update
on public.lead_form_settings
to authenticated;


-- ------------------------------------------------------------
-- TRACKING LINKS
-- ------------------------------------------------------------

grant
  select,
  insert,
  update,
  delete
on public.tracking_links
to authenticated;


-- ------------------------------------------------------------
-- VISITOR SESSIONS
--
-- Direct authenticated access is read-only.
--
-- RLS below allows only PLATFORM_ADMIN.
--
-- Owner analytics will later use validated server-side
-- aggregate queries rather than exposing anonymous visitor
-- records directly.
-- ------------------------------------------------------------

grant select
on public.visitor_sessions
to authenticated;


-- ------------------------------------------------------------
-- ACTIVITY EVENTS
--
-- Direct writes are NOT granted.
--
-- Public activity collection uses a validated server-side
-- Route Handler.
-- ------------------------------------------------------------

grant select
on public.activity_events
to authenticated;


-- ------------------------------------------------------------
-- LEADS
--
-- Owners may read only OWNER_VISIBLE leads through RLS.
--
-- Direct update privilege is restricted to status only.
--
-- Owners therefore cannot change:
--
--   visibility
--   contact_intent
--   business_id
--   owner_visible_at
--   direct contact metadata
--
-- ------------------------------------------------------------

grant select
on public.leads
to authenticated;


grant update (
  status
)
on public.leads
to authenticated;


-- ------------------------------------------------------------
-- LEAD NOTES
-- ------------------------------------------------------------

grant
  select,
  insert,
  update,
  delete
on public.lead_notes
to authenticated;


-- ------------------------------------------------------------
-- LEAD STATUS HISTORY
--
-- Written only by database trigger.
-- ------------------------------------------------------------

grant select
on public.lead_status_history
to authenticated;


-- ------------------------------------------------------------
-- LEAD INTELLIGENCE
--
-- Generated by trusted LeadNexus server-side analysis.
-- Authenticated clients receive read-only access through RLS.
-- ------------------------------------------------------------

grant select
on public.lead_intelligence
to authenticated;


-- ------------------------------------------------------------
-- LEAD RECOVERY REVIEWS
--
-- Only PLATFORM_ADMIN can see these through RLS.
--
-- Changes are made using the secure recovery functions from
-- migration 002.
-- ------------------------------------------------------------

grant select
on public.lead_recovery_reviews
to authenticated;


-- ------------------------------------------------------------
-- SEO SETTINGS
-- ------------------------------------------------------------

grant
  select,
  update
on public.seo_settings
to authenticated;


-- ------------------------------------------------------------
-- INTEGRATION CONNECTIONS
--
-- Metadata only.
-- No external API secrets are stored here.
-- ------------------------------------------------------------

grant
  select,
  insert,
  update,
  delete
on public.integration_connections
to authenticated;


-- ------------------------------------------------------------
-- OUTBOX
--
-- Platform admin visibility only.
--
-- Application clients never directly create integration events.
-- ------------------------------------------------------------

grant select
on public.outbox_events
to authenticated;


-- ------------------------------------------------------------
-- AUDIT LOGS
--
-- Platform admin visibility only.
-- ------------------------------------------------------------

grant select
on public.audit_logs
to authenticated;


-- ============================================================
-- PROFILES POLICIES
-- ============================================================

drop policy if exists
  "profiles_select"
on public.profiles;


create policy "profiles_select"
on public.profiles
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  id = (select auth.uid())
);


drop policy if exists
  "profiles_update_own"
on public.profiles;


create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);


-- ============================================================
-- BUSINESSES POLICIES
-- ============================================================

drop policy if exists
  "businesses_select"
on public.businesses;


create policy "businesses_select"
on public.businesses
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.is_business_member(id)
);


drop policy if exists
  "businesses_insert"
on public.businesses;


create policy "businesses_insert"
on public.businesses
for insert
to authenticated
with check (
  created_by = (select auth.uid())
);


drop policy if exists
  "businesses_update"
on public.businesses;


create policy "businesses_update"
on public.businesses
for update
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(id)
)
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(id)
);


-- No direct authenticated DELETE policy.
--
-- Businesses should be archived/paused instead of physically
-- deleted through normal application actions.


-- ============================================================
-- BUSINESS MEMBERS POLICIES
-- ============================================================

drop policy if exists
  "business_members_select"
on public.business_members;


create policy "business_members_select"
on public.business_members
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  user_id = (select auth.uid())

  or

  public.can_manage_business(business_id)
);


-- No direct INSERT/UPDATE/DELETE policies in MVP.


-- ============================================================
-- BUSINESS SOCIAL LINKS POLICIES
-- ============================================================

drop policy if exists
  "business_social_links_select"
on public.business_social_links;


create policy "business_social_links_select"
on public.business_social_links
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.is_business_member(business_id)
);


drop policy if exists
  "business_social_links_insert"
on public.business_social_links;


create policy "business_social_links_insert"
on public.business_social_links
for insert
to authenticated
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


drop policy if exists
  "business_social_links_update"
on public.business_social_links;


create policy "business_social_links_update"
on public.business_social_links
for update
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
)
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


drop policy if exists
  "business_social_links_delete"
on public.business_social_links;


create policy "business_social_links_delete"
on public.business_social_links
for delete
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


-- ============================================================
-- BUSINESS HOURS POLICIES
-- ============================================================

drop policy if exists
  "business_hours_select"
on public.business_hours;


create policy "business_hours_select"
on public.business_hours
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.is_business_member(business_id)
);


drop policy if exists
  "business_hours_insert"
on public.business_hours;


create policy "business_hours_insert"
on public.business_hours
for insert
to authenticated
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


drop policy if exists
  "business_hours_update"
on public.business_hours;


create policy "business_hours_update"
on public.business_hours
for update
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
)
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


drop policy if exists
  "business_hours_delete"
on public.business_hours;


create policy "business_hours_delete"
on public.business_hours
for delete
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


-- ============================================================
-- PRODUCTS POLICIES
-- ============================================================

drop policy if exists
  "products_select"
on public.products;


create policy "products_select"
on public.products
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.is_business_member(business_id)
);


drop policy if exists
  "products_insert"
on public.products;


create policy "products_insert"
on public.products
for insert
to authenticated
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


drop policy if exists
  "products_update"
on public.products;


create policy "products_update"
on public.products
for update
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
)
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


drop policy if exists
  "products_delete"
on public.products;


create policy "products_delete"
on public.products
for delete
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


-- ============================================================
-- CONTACT TEMPLATES POLICIES
-- ============================================================

drop policy if exists
  "contact_templates_select"
on public.contact_templates;


create policy "contact_templates_select"
on public.contact_templates
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.is_business_member(business_id)
);


drop policy if exists
  "contact_templates_insert"
on public.contact_templates;


create policy "contact_templates_insert"
on public.contact_templates
for insert
to authenticated
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


drop policy if exists
  "contact_templates_update"
on public.contact_templates;


create policy "contact_templates_update"
on public.contact_templates
for update
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
)
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


drop policy if exists
  "contact_templates_delete"
on public.contact_templates;


create policy "contact_templates_delete"
on public.contact_templates
for delete
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


-- ============================================================
-- PUBLIC PAGE SETTINGS POLICIES
-- ============================================================

drop policy if exists
  "public_page_settings_select"
on public.public_page_settings;


create policy "public_page_settings_select"
on public.public_page_settings
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.is_business_member(business_id)
);


drop policy if exists
  "public_page_settings_update"
on public.public_page_settings;


create policy "public_page_settings_update"
on public.public_page_settings
for update
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
)
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


-- ============================================================
-- LEAD FORM SETTINGS POLICIES
-- ============================================================

drop policy if exists
  "lead_form_settings_select"
on public.lead_form_settings;


create policy "lead_form_settings_select"
on public.lead_form_settings
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.is_business_member(business_id)
);


drop policy if exists
  "lead_form_settings_update"
on public.lead_form_settings;


create policy "lead_form_settings_update"
on public.lead_form_settings
for update
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
)
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


-- ============================================================
-- TRACKING LINKS POLICIES
-- ============================================================

drop policy if exists
  "tracking_links_select"
on public.tracking_links;


create policy "tracking_links_select"
on public.tracking_links
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.is_business_member(business_id)
);


drop policy if exists
  "tracking_links_insert"
on public.tracking_links;


create policy "tracking_links_insert"
on public.tracking_links
for insert
to authenticated
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


drop policy if exists
  "tracking_links_update"
on public.tracking_links;


create policy "tracking_links_update"
on public.tracking_links
for update
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
)
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


drop policy if exists
  "tracking_links_delete"
on public.tracking_links;


create policy "tracking_links_delete"
on public.tracking_links
for delete
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(business_id)
);


-- ============================================================
-- VISITOR SESSIONS POLICIES
--
-- PLATFORM ADMIN ONLY.
--
-- Owners intentionally do NOT receive raw anonymous visitor
-- session access.
-- ============================================================

drop policy if exists
  "visitor_sessions_admin_select"
on public.visitor_sessions;


create policy "visitor_sessions_admin_select"
on public.visitor_sessions
for select
to authenticated
using (
  (select public.is_platform_admin())
);


-- ============================================================
-- LEADS POLICIES
-- ============================================================

drop policy if exists
  "leads_select"
on public.leads;


create policy "leads_select"
on public.leads
for select
to authenticated
using (
  (
    select public.is_platform_admin()
  )

  or

  (
    visibility = 'OWNER_VISIBLE'

    and archived_at is null

    and public.is_business_member(
      business_id
    )
  )
);


drop policy if exists
  "leads_update_status"
on public.leads;


create policy "leads_update_status"
on public.leads
for update
to authenticated
using (
  (
    select public.is_platform_admin()
  )

  or

  (
    visibility = 'OWNER_VISIBLE'

    and archived_at is null

    and public.can_manage_business(
      business_id
    )
  )
)
with check (
  (
    select public.is_platform_admin()
  )

  or

  (
    visibility = 'OWNER_VISIBLE'

    and archived_at is null

    and public.can_manage_business(
      business_id
    )
  )
);


-- There is deliberately NO authenticated INSERT policy.
--
-- Lead creation occurs through the validated server-side
-- public Lead API.


-- ============================================================
-- ACTIVITY EVENTS POLICIES
--
-- ADMIN:
--   all activity.
--
-- OWNER:
--   activity belonging only to an OWNER_VISIBLE identified lead.
--
-- Anonymous visitor behavior is therefore not directly exposed
-- to the business owner.
-- ============================================================

drop policy if exists
  "activity_events_select"
on public.activity_events;


create policy "activity_events_select"
on public.activity_events
for select
to authenticated
using (
  (
    select public.is_platform_admin()
  )

  or

  (
    lead_id is not null

    and public.can_view_owner_visible_lead(
      lead_id
    )
  )
);


-- No direct authenticated INSERT/UPDATE/DELETE policies.


-- ============================================================
-- LEAD NOTES POLICIES
-- ============================================================

drop policy if exists
  "lead_notes_select"
on public.lead_notes;


create policy "lead_notes_select"
on public.lead_notes
for select
to authenticated
using (
  (
    select public.is_platform_admin()
  )

  or

  public.can_view_owner_visible_lead(
    lead_id
  )
);


drop policy if exists
  "lead_notes_insert"
on public.lead_notes;


create policy "lead_notes_insert"
on public.lead_notes
for insert
to authenticated
with check (
  author_user_id = (select auth.uid())

  and

  (
    (select public.is_platform_admin())

    or

    public.can_view_owner_visible_lead(
      lead_id
    )
  )
);


drop policy if exists
  "lead_notes_update"
on public.lead_notes;


create policy "lead_notes_update"
on public.lead_notes
for update
to authenticated
using (
  (
    select public.is_platform_admin()
  )

  or

  (
    author_user_id = (select auth.uid())

    and

    public.can_view_owner_visible_lead(
      lead_id
    )
  )
)
with check (
  (
    select public.is_platform_admin()
  )

  or

  (
    author_user_id = (select auth.uid())

    and

    public.can_view_owner_visible_lead(
      lead_id
    )
  )
);


drop policy if exists
  "lead_notes_delete"
on public.lead_notes;


create policy "lead_notes_delete"
on public.lead_notes
for delete
to authenticated
using (
  (
    select public.is_platform_admin()
  )

  or

  (
    author_user_id = (select auth.uid())

    and

    public.can_view_owner_visible_lead(
      lead_id
    )
  )
);


-- ============================================================
-- LEAD STATUS HISTORY POLICIES
-- ============================================================

drop policy if exists
  "lead_status_history_select"
on public.lead_status_history;


create policy "lead_status_history_select"
on public.lead_status_history
for select
to authenticated
using (
  (
    select public.is_platform_admin()
  )

  or

  public.can_view_owner_visible_lead(
    lead_id
  )
);


-- History is trigger-written only.


-- ============================================================
-- LEAD INTELLIGENCE POLICIES
--
-- Admin can view intelligence for every lead.
--
-- Business owner receives intelligence only after that lead has
-- legitimately become OWNER_VISIBLE.
-- ============================================================

drop policy if exists
  "lead_intelligence_select"
on public.lead_intelligence;


create policy "lead_intelligence_select"
on public.lead_intelligence
for select
to authenticated
using (
  (
    select public.is_platform_admin()
  )

  or

  public.can_view_owner_visible_lead(
    lead_id
  )
);


-- AI analysis writes use trusted server-side access.


-- ============================================================
-- RECOVERY REVIEW POLICIES
--
-- PLATFORM ADMIN ONLY.
-- ============================================================

drop policy if exists
  "lead_recovery_reviews_admin_select"
on public.lead_recovery_reviews;


create policy "lead_recovery_reviews_admin_select"
on public.lead_recovery_reviews
for select
to authenticated
using (
  (select public.is_platform_admin())
);


-- Writes use:
--
--   send_recovered_lead_to_owner(...)
--   ignore_recovered_lead(...)
--
-- from migration 002.


-- ============================================================
-- SEO SETTINGS POLICIES
-- ============================================================

drop policy if exists
  "seo_settings_select"
on public.seo_settings;


create policy "seo_settings_select"
on public.seo_settings
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.is_business_member(
    business_id
  )
);


drop policy if exists
  "seo_settings_update"
on public.seo_settings;


create policy "seo_settings_update"
on public.seo_settings
for update
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(
    business_id
  )
)
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(
    business_id
  )
);


-- ============================================================
-- INTEGRATION CONNECTIONS POLICIES
-- ============================================================

drop policy if exists
  "integration_connections_select"
on public.integration_connections;


create policy "integration_connections_select"
on public.integration_connections
for select
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.is_business_member(
    business_id
  )
);


drop policy if exists
  "integration_connections_insert"
on public.integration_connections;


create policy "integration_connections_insert"
on public.integration_connections
for insert
to authenticated
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(
    business_id
  )
);


drop policy if exists
  "integration_connections_update"
on public.integration_connections;


create policy "integration_connections_update"
on public.integration_connections
for update
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(
    business_id
  )
)
with check (
  (select public.is_platform_admin())

  or

  public.can_manage_business(
    business_id
  )
);


drop policy if exists
  "integration_connections_delete"
on public.integration_connections;


create policy "integration_connections_delete"
on public.integration_connections
for delete
to authenticated
using (
  (select public.is_platform_admin())

  or

  public.can_manage_business(
    business_id
  )
);


-- ============================================================
-- OUTBOX POLICIES
--
-- PLATFORM ADMIN READ ONLY.
--
-- Server-side trusted processes manage writes.
-- ============================================================

drop policy if exists
  "outbox_events_admin_select"
on public.outbox_events;


create policy "outbox_events_admin_select"
on public.outbox_events
for select
to authenticated
using (
  (select public.is_platform_admin())
);


-- ============================================================
-- AUDIT LOG POLICIES
--
-- PLATFORM ADMIN READ ONLY.
-- ============================================================

drop policy if exists
  "audit_logs_admin_select"
on public.audit_logs;


create policy "audit_logs_admin_select"
on public.audit_logs
for select
to authenticated
using (
  (select public.is_platform_admin())
);


-- ============================================================
-- SECURITY COMMENTS
-- ============================================================

comment on policy "leads_select"
on public.leads is
  'Platform admin sees all leads; business users see only OWNER_VISIBLE leads belonging to their business.';


comment on policy "visitor_sessions_admin_select"
on public.visitor_sessions is
  'Raw anonymous visitor sessions are restricted to LeadNexus platform administrators.';


comment on policy "activity_events_select"
on public.activity_events is
  'Owners see activity only after it belongs to an OWNER_VISIBLE identified lead; platform admin sees all activity.';


comment on policy "lead_recovery_reviews_admin_select"
on public.lead_recovery_reviews is
  'Lead Recovery review decisions are LeadNexus platform-admin-only data.';


-- ============================================================
-- FINAL SECURITY MODEL
--
-- ANON
-- ------------------------------------------------------------
--
-- Direct table access:
--   NONE
--
--
-- AUTHENTICATED BUSINESS OWNER
-- ------------------------------------------------------------
--
-- Own:
--   profile
--   businesses
--   products
--   business settings
--   tracking links
--   SEO
--   integrations
--
-- Leads:
--   OWNER_VISIBLE only
--
-- Activity:
--   identified OWNER_VISIBLE lead only
--
-- Cannot see:
--   ADMIN_ONLY leads
--   raw anonymous visitor sessions
--   recovery review queue
--   other businesses
--   audit logs
--   outbox queue
--
--
-- PLATFORM ADMIN
-- ------------------------------------------------------------
--
-- Read:
--   all platform data
--
-- Recovery actions:
--   secure database functions
--
--
-- PUBLIC LEAD
-- ------------------------------------------------------------
--
-- No Data API table access.
--
-- Next.js server validates and performs:
--
--   session creation
--   activity creation
--   lead capture
--   contact tracking
--   public business-page data retrieval
--
-- using the server-only Supabase secret client.
--
-- ===========================================================