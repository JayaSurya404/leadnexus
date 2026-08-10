-- ============================================================
-- LeadNexus
-- Migration: 003_indexes.sql
--
-- Purpose:
--   Performance indexes for the LeadNexus MVP.
--
-- Designed for:
--   - Platform admin workspace
--   - Business-owner dashboard
--   - Business/member authorization
--   - Product listings
--   - Tracking-link redirects
--   - Visitor attribution
--   - Lead searches and filters
--   - Owner-visible leads
--   - Recovered leads
--   - Lead Intelligence
--   - Activity timelines
--   - Analytics
--   - Outbox processing
--   - Audit logs
--
-- Notes:
--   Primary keys and UNIQUE constraints from migration 001
--   already create indexes automatically.
--
--   Therefore we DO NOT duplicate indexes for:
--
--     profiles.id
--     businesses.slug
--     business_members(business_id, user_id)
--     business_hours(business_id, day_of_week)
--     products(business_id, slug)
--     public_page_settings.business_id
--     lead_form_settings.business_id
--     tracking_links.code
--     visitor_sessions.session_token
--     lead_intelligence.lead_id
--     lead_recovery_reviews.lead_id
--     seo_settings.business_id
--     integration_connections(business_id, provider)
--     outbox_events.idempotency_key
--
-- ============================================================


-- ============================================================
-- PROFILES
-- ============================================================

-- Platform-admin lookup / admin user filtering.

create index if not exists
  idx_profiles_platform_role
on public.profiles (
  platform_role
);


-- ============================================================
-- BUSINESSES
-- ============================================================

-- Businesses created by a particular authenticated user.

create index if not exists
  idx_businesses_created_by
on public.businesses (
  created_by
)
where created_by is not null;


-- Admin dashboard:
-- active businesses ordered by newest first.

create index if not exists
  idx_businesses_status_created_at
on public.businesses (
  status,
  created_at desc
);


-- Useful for admin filtering by business location.

create index if not exists
  idx_businesses_location
on public.businesses (
  country,
  state,
  city
);


-- Business type/category reporting.

create index if not exists
  idx_businesses_category
on public.businesses (
  category
)
where category is not null;


create index if not exists
  idx_businesses_business_type
on public.businesses (
  business_type
)
where business_type is not null;


-- ============================================================
-- BUSINESS MEMBERS
-- ============================================================

-- The UNIQUE constraint is ordered:
--
--   (business_id, user_id)
--
-- but we frequently begin from auth.uid() and need to discover
-- which businesses belong to that user.
--
-- Therefore user_id requires its own index.

create index if not exists
  idx_business_members_user_id
on public.business_members (
  user_id
);


-- User -> membership -> role queries.

create index if not exists
  idx_business_members_user_role
on public.business_members (
  user_id,
  role
);


-- ============================================================
-- BUSINESS SOCIAL LINKS
-- ============================================================

-- Public business page:
-- retrieve enabled social/contact links in display order.

create index if not exists
  idx_business_social_links_business_enabled_sort
on public.business_social_links (
  business_id,
  sort_order,
  id
)
where enabled = true;


-- ============================================================
-- PRODUCTS / SERVICES
-- ============================================================

-- Business workspace:
-- active/inactive product management.

create index if not exists
  idx_products_business_active_sort
on public.products (
  business_id,
  active,
  sort_order,
  created_at desc
);


-- Public page normally needs only active products.

create index if not exists
  idx_products_public_active
on public.products (
  business_id,
  sort_order,
  id
)
where
  active = true
  and archived_at is null;


-- Featured-product section.

create index if not exists
  idx_products_featured_active
on public.products (
  business_id,
  sort_order,
  id
)
where
  active = true
  and featured = true
  and archived_at is null;


-- Product/service analytics filtering.

create index if not exists
  idx_products_business_item_type
on public.products (
  business_id,
  item_type
)
where archived_at is null;


-- ============================================================
-- CONTACT TEMPLATES
-- ============================================================

-- Business/public-page lookup:
-- find active template for a particular product and channel.

create index if not exists
  idx_contact_templates_business_product_channel
on public.contact_templates (
  business_id,
  product_id,
  channel
)
where active = true;


-- Default business-level templates have product_id = null.

create index if not exists
  idx_contact_templates_business_default
on public.contact_templates (
  business_id,
  channel
)
where
  product_id is null
  and active = true;


-- ============================================================
-- TRACKING LINKS
-- ============================================================

-- tracking_links.code is already UNIQUE/indexed.
--
-- Business owner's tracking-link management screen.

create index if not exists
  idx_tracking_links_business_created_at
on public.tracking_links (
  business_id,
  created_at desc
);


-- Only active links.

create index if not exists
  idx_tracking_links_business_active
on public.tracking_links (
  business_id,
  created_at desc
)
where active = true;


-- Campaign/source analytics.

create index if not exists
  idx_tracking_links_business_source_campaign
on public.tracking_links (
  business_id,
  source,
  campaign
);


-- Product-specific campaign links.

create index if not exists
  idx_tracking_links_product
on public.tracking_links (
  product_id
)
where product_id is not null;


-- ============================================================
-- VISITOR SESSIONS
-- ============================================================

-- Business analytics:
-- most recently active visitors.

create index if not exists
  idx_visitor_sessions_business_last_activity
on public.visitor_sessions (
  business_id,
  last_activity_at desc
);


-- Business visitor timeline by first visit.

create index if not exists
  idx_visitor_sessions_business_first_seen
on public.visitor_sessions (
  business_id,
  first_seen_at desc
);


-- Tracking-link analytics.

create index if not exists
  idx_visitor_sessions_tracking_link
on public.visitor_sessions (
  tracking_link_id,
  first_seen_at desc
)
where tracking_link_id is not null;


-- Lead -> session relationship.

create index if not exists
  idx_visitor_sessions_lead
on public.visitor_sessions (
  lead_id
)
where lead_id is not null;


-- Source analytics.

create index if not exists
  idx_visitor_sessions_business_first_source
on public.visitor_sessions (
  business_id,
  first_source,
  first_seen_at desc
);


-- Campaign analytics.

create index if not exists
  idx_visitor_sessions_business_campaign
on public.visitor_sessions (
  business_id,
  first_campaign,
  first_seen_at desc
)
where first_campaign is not null;


-- Return-visitor reporting.

create index if not exists
  idx_visitor_sessions_return_visitors
on public.visitor_sessions (
  business_id,
  visit_count desc,
  last_activity_at desc
)
where visit_count > 1;


-- ============================================================
-- LEADS
-- ============================================================

-- Main platform-admin lead list.

create index if not exists
  idx_leads_created_at
on public.leads (
  created_at desc
)
where archived_at is null;


-- Business owner's main lead list.

create index if not exists
  idx_leads_business_created_at
on public.leads (
  business_id,
  created_at desc
)
where archived_at is null;


-- CRITICAL:
--
-- Business owners are only allowed to see OWNER_VISIBLE leads.
--
-- This partial index directly supports that common query.

create index if not exists
  idx_leads_owner_visible
on public.leads (
  business_id,
  created_at desc
)
where
  visibility = 'OWNER_VISIBLE'
  and archived_at is null;


-- Owner-visible lead status filtering.

create index if not exists
  idx_leads_owner_visible_status
on public.leads (
  business_id,
  status,
  created_at desc
)
where
  visibility = 'OWNER_VISIBLE'
  and archived_at is null;


-- Admin-only captured leads.
--
-- Important for the Lead Recovery workflow.

create index if not exists
  idx_leads_admin_only
on public.leads (
  business_id,
  created_at desc
)
where
  visibility = 'ADMIN_ONLY'
  and archived_at is null;


-- Contact-intent filtering:
--
-- NONE
-- DIRECT_CONTACT
-- RECOVERED

create index if not exists
  idx_leads_business_contact_intent
on public.leads (
  business_id,
  contact_intent,
  created_at desc
)
where archived_at is null;


-- Lead conversion funnel.

create index if not exists
  idx_leads_business_status
on public.leads (
  business_id,
  status,
  created_at desc
)
where archived_at is null;


-- Product interest.

create index if not exists
  idx_leads_business_product
on public.leads (
  business_id,
  primary_product_id,
  created_at desc
)
where
  primary_product_id is not null
  and archived_at is null;


-- Visitor-session -> lead relationship.

create index if not exists
  idx_leads_visitor_session
on public.leads (
  visitor_session_id
)
where visitor_session_id is not null;


-- Phone lookup.
--
-- Useful for duplicate/contact checks and admin lookup.

create index if not exists
  idx_leads_phone_normalized
on public.leads (
  phone_normalized
)
where phone_normalized is not null;


-- Business + phone lookup avoids scanning leads from unrelated
-- businesses when checking an existing person.

create index if not exists
  idx_leads_business_phone_normalized
on public.leads (
  business_id,
  phone_normalized,
  created_at desc
)
where
  phone_normalized is not null
  and archived_at is null;


-- Email lookup when supplied.

create index if not exists
  idx_leads_business_email
on public.leads (
  business_id,
  email,
  created_at desc
)
where
  email is not null
  and archived_at is null;


-- Source-performance analytics.

create index if not exists
  idx_leads_business_first_source
on public.leads (
  business_id,
  first_source,
  created_at desc
)
where
  first_source is not null
  and archived_at is null;


-- Campaign-performance analytics.

create index if not exists
  idx_leads_business_first_campaign
on public.leads (
  business_id,
  first_campaign,
  created_at desc
)
where
  first_campaign is not null
  and archived_at is null;


-- Recently exposed leads.

create index if not exists
  idx_leads_business_owner_visible_at
on public.leads (
  business_id,
  owner_visible_at desc
)
where
  visibility = 'OWNER_VISIBLE'
  and owner_visible_at is not null
  and archived_at is null;


-- ============================================================
-- ACTIVITY EVENTS
-- ============================================================

-- Full chronological visitor journey.

create index if not exists
  idx_activity_events_session_occurred_at
on public.activity_events (
  session_id,
  occurred_at asc,
  id
);


-- Full chronological lead journey.

create index if not exists
  idx_activity_events_lead_occurred_at
on public.activity_events (
  lead_id,
  occurred_at asc,
  id
)
where lead_id is not null;


-- Business analytics:
-- recent activity.

create index if not exists
  idx_activity_events_business_occurred_at
on public.activity_events (
  business_id,
  occurred_at desc
);


-- Business event-type analytics.

create index if not exists
  idx_activity_events_business_type_time
on public.activity_events (
  business_id,
  event_type,
  occurred_at desc
);


-- Product-interest analytics.

create index if not exists
  idx_activity_events_product_time
on public.activity_events (
  product_id,
  occurred_at desc
)
where product_id is not null;


-- Product + event lookup.
--
-- Useful for:
--   PRODUCT_VIEW
--   PRODUCT_ENGAGED

create index if not exists
  idx_activity_events_business_product_type
on public.activity_events (
  business_id,
  product_id,
  event_type,
  occurred_at desc
)
where product_id is not null;


-- Known lead + event type.

create index if not exists
  idx_activity_events_lead_type
on public.activity_events (
  lead_id,
  event_type,
  occurred_at desc
)
where lead_id is not null;


-- Contact-action analytics.
--
-- Partial index keeps this smaller than indexing every event.

create index if not exists
  idx_activity_events_contact_actions
on public.activity_events (
  business_id,
  occurred_at desc
)
where event_type in (
  'WHATSAPP_CLICK',
  'INSTAGRAM_CLICK',
  'FACEBOOK_CLICK',
  'LINKEDIN_CLICK',
  'PHONE_CLICK',
  'EMAIL_CLICK',
  'WEBSITE_CLICK'
);


-- Lead form funnel analytics.

create index if not exists
  idx_activity_events_form_funnel
on public.activity_events (
  business_id,
  event_type,
  occurred_at desc
)
where event_type in (
  'LEAD_FORM_VIEW',
  'LEAD_FORM_STARTED',
  'LEAD_FORM_SUBMITTED'
);


-- ============================================================
-- LEAD NOTES
-- ============================================================

create index if not exists
  idx_lead_notes_lead_created_at
on public.lead_notes (
  lead_id,
  created_at desc
);


create index if not exists
  idx_lead_notes_author
on public.lead_notes (
  author_user_id,
  created_at desc
)
where author_user_id is not null;


-- ============================================================
-- LEAD STATUS HISTORY
-- ============================================================

create index if not exists
  idx_lead_status_history_lead_created_at
on public.lead_status_history (
  lead_id,
  created_at asc,
  id
);


-- Funnel-history analytics.

create index if not exists
  idx_lead_status_history_new_status
on public.lead_status_history (
  new_status,
  created_at desc
);


-- ============================================================
-- LEAD INTELLIGENCE
-- ============================================================

-- lead_id already has a UNIQUE index.
--
-- Platform-admin intelligence queue.

create index if not exists
  idx_lead_intelligence_temperature_score
on public.lead_intelligence (
  temperature,
  score desc,
  analyzed_at desc nulls last
);


-- HOT lead queue.

create index if not exists
  idx_lead_intelligence_hot
on public.lead_intelligence (
  score desc,
  analyzed_at desc nulls last
)
where temperature = 'HOT';


-- Leads waiting for first analysis.

create index if not exists
  idx_lead_intelligence_unanalyzed
on public.lead_intelligence (
  created_at asc
)
where analyzed_at is null;


-- ============================================================
-- LEAD RECOVERY REVIEWS
-- ============================================================

-- lead_id is UNIQUE/indexed already.
--
-- Admin recovery queue.

create index if not exists
  idx_lead_recovery_reviews_pending
on public.lead_recovery_reviews (
  created_at asc
)
where decision = 'PENDING';


-- Completed recovery history.

create index if not exists
  idx_lead_recovery_reviews_decision_time
on public.lead_recovery_reviews (
  decision,
  reviewed_at desc nulls last
);


create index if not exists
  idx_lead_recovery_reviews_reviewed_by
on public.lead_recovery_reviews (
  reviewed_by,
  reviewed_at desc
)
where reviewed_by is not null;


-- ============================================================
-- INTEGRATION CONNECTIONS
-- ============================================================

-- Unique constraint already handles:
--
--   business_id + provider
--
-- This supports admin/provider status queries.

create index if not exists
  idx_integration_connections_provider_status
on public.integration_connections (
  provider,
  status
);


-- ============================================================
-- OUTBOX EVENTS
-- ============================================================

-- CRITICAL future integration-worker query:
--
-- select ...
-- where
--   status = 'PENDING'
--   and available_at <= now()
-- order by available_at
-- limit ...
--
-- Partial index keeps completed events out of the hot queue.

create index if not exists
  idx_outbox_events_pending
on public.outbox_events (
  available_at asc,
  created_at asc
)
where status = 'PENDING';


-- Retry/error queue.

create index if not exists
  idx_outbox_events_failed
on public.outbox_events (
  available_at asc,
  attempt_count,
  created_at asc
)
where status = 'FAILED';


-- Find events belonging to a particular entity.

create index if not exists
  idx_outbox_events_aggregate
on public.outbox_events (
  aggregate_type,
  aggregate_id,
  created_at desc
)
where aggregate_id is not null;


-- Event-type history.

create index if not exists
  idx_outbox_events_event_type
on public.outbox_events (
  event_type,
  created_at desc
);


-- ============================================================
-- AUDIT LOGS
-- ============================================================

-- Global admin audit timeline.

create index if not exists
  idx_audit_logs_created_at
on public.audit_logs (
  created_at desc
);


-- Audit history for one entity.

create index if not exists
  idx_audit_logs_entity
on public.audit_logs (
  entity_type,
  entity_id,
  created_at desc
)
where entity_id is not null;


-- Actions performed by a particular authenticated user.

create index if not exists
  idx_audit_logs_actor
on public.audit_logs (
  actor_user_id,
  created_at desc
)
where actor_user_id is not null;


-- Filter audit history by action.

create index if not exists
  idx_audit_logs_action
on public.audit_logs (
  action,
  created_at desc
);


-- ============================================================
-- COMMENTS / PERFORMANCE INTENT
-- ============================================================

comment on index public.idx_leads_owner_visible is
  'Optimizes the business-owner lead list while excluding admin-only captured leads.';


comment on index public.idx_leads_admin_only is
  'Optimizes admin-only lead capture and Lead Recovery workflows.';


comment on index public.idx_activity_events_lead_occurred_at is
  'Optimizes chronological behavior timelines for identified leads.';


comment on index public.idx_activity_events_session_occurred_at is
  'Optimizes anonymous visitor-session timelines before a lead is identified.';


comment on index public.idx_activity_events_contact_actions is
  'Optimizes WhatsApp/social/phone/email/website contact-intent analytics.';


comment on index public.idx_lead_intelligence_hot is
  'Optimizes the platform-admin HOT lead intelligence queue.';


comment on index public.idx_outbox_events_pending is
  'Optimizes future asynchronous integration/event delivery workers.';