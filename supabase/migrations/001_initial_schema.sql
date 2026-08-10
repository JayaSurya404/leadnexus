-- ============================================================
-- LeadNexus
-- Migration: 001_initial_schema.sql
--
-- Purpose:
--   Core database schema for the LeadNexus MVP.
--
-- Product roles:
--   1. PLATFORM_ADMIN
--   2. BUSINESS OWNER / MANAGER
--   3. PUBLIC LEAD (no LeadNexus account required)
--
-- Core modules:
--   - Business onboarding and public business pages
--   - Products / services
--   - Social and direct contact links
--   - Contact message templates
--   - Campaign / tracking links
--   - Visitor session tracking
--   - Lead capture
--   - Visitor activity tracking
--   - Direct-contact intent
--   - AI Lead Intelligence
--   - Hot / Warm / Cold scoring
--   - Admin-controlled lead recovery
--   - Business-owner lead management
--   - SEO configuration
--   - Future integration / VoiceNexus outbox
--   - Audit logging
--
-- IMPORTANT:
--   RLS policies are intentionally created in migration 004.
--   Do not deploy only this migration to production.
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- ENUM TYPES
-- ============================================================

create type public.platform_role as enum (
  'USER',
  'PLATFORM_ADMIN'
);


create type public.business_status as enum (
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'ARCHIVED'
);


create type public.business_member_role as enum (
  'OWNER',
  'MANAGER'
);


create type public.social_platform as enum (
  'WHATSAPP',
  'INSTAGRAM',
  'FACEBOOK',
  'LINKEDIN',
  'YOUTUBE',
  'X',
  'WEBSITE',
  'EMAIL',
  'PHONE',
  'OTHER'
);


create type public.catalog_item_type as enum (
  'PRODUCT',
  'SERVICE'
);


create type public.contact_channel as enum (
  'WHATSAPP',
  'INSTAGRAM',
  'FACEBOOK',
  'LINKEDIN',
  'EMAIL',
  'PHONE',
  'WEBSITE',
  'OTHER'
);


create type public.activity_event_type as enum (
  'SESSION_STARTED',
  'PAGE_VIEW',
  'LEAD_FORM_VIEW',
  'LEAD_FORM_STARTED',
  'LEAD_FORM_SUBMITTED',
  'PRODUCT_VIEW',
  'PRODUCT_ENGAGED',
  'CTA_CLICK',
  'WHATSAPP_CLICK',
  'INSTAGRAM_CLICK',
  'FACEBOOK_CLICK',
  'LINKEDIN_CLICK',
  'PHONE_CLICK',
  'EMAIL_CLICK',
  'WEBSITE_CLICK',
  'RETURN_VISIT',
  'PAGE_EXIT'
);


create type public.lead_status as enum (
  'NEW',
  'CONTACTED',
  'RESPONDED',
  'QUALIFIED',
  'CUSTOMER',
  'NO_RESPONSE',
  'NOT_INTERESTED',
  'LOST'
);


create type public.lead_visibility as enum (
  'ADMIN_ONLY',
  'OWNER_VISIBLE'
);


create type public.lead_contact_intent as enum (
  'NONE',
  'DIRECT_CONTACT',
  'RECOVERED'
);


create type public.lead_temperature as enum (
  'UNKNOWN',
  'COLD',
  'WARM',
  'HOT'
);


create type public.lead_analysis_method as enum (
  'RULES',
  'AI',
  'HYBRID'
);


create type public.recovery_decision as enum (
  'PENDING',
  'SENT_TO_OWNER',
  'IGNORED'
);


create type public.integration_provider as enum (
  'VOICENEXUS',
  'GOOGLE_SEARCH_CONSOLE',
  'META_WHATSAPP',
  'RESEND',
  'OTHER'
);


create type public.integration_status as enum (
  'DISCONNECTED',
  'CONNECTED',
  'ERROR',
  'DISABLED'
);


create type public.outbox_status as enum (
  'PENDING',
  'PROCESSING',
  'SENT',
  'FAILED'
);


-- ============================================================
-- PROFILES
--
-- One profile for every authenticated LeadNexus user.
--
-- Platform administrators are identified here.
-- Business ownership is controlled separately by
-- business_members.
-- ============================================================

create table public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text,

  phone text,

  avatar_url text,

  platform_role public.platform_role
    not null
    default 'USER',

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint profiles_full_name_length
    check (
      full_name is null
      or char_length(trim(full_name)) between 1 and 120
    ),

  constraint profiles_phone_length
    check (
      phone is null
      or char_length(trim(phone)) between 5 and 32
    )
);


-- ============================================================
-- BUSINESSES
-- ============================================================

create table public.businesses (
  id uuid primary key
    default gen_random_uuid(),

  created_by uuid
    references public.profiles(id)
    on delete set null,

  name text
    not null,

  slug text
    not null
    unique,

  category text,

  business_type text,

  description text,

  business_email text,

  business_phone text,

  whatsapp_number text,

  website text,

  address_line_1 text,

  address_line_2 text,

  city text,

  state text,

  country text,

  postal_code text,

  service_area text,

  logo_url text,

  cover_url text,

  status public.business_status
    not null
    default 'DRAFT',

  onboarding_step smallint
    not null
    default 0,

  onboarding_completed_at timestamptz,

  archived_at timestamptz,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint businesses_name_length
    check (
      char_length(trim(name)) between 2 and 160
    ),

  constraint businesses_slug_format
    check (
      slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),

  constraint businesses_slug_length
    check (
      char_length(slug) between 2 and 100
    ),

  constraint businesses_onboarding_step_range
    check (
      onboarding_step between 0 and 20
    )
);


-- ============================================================
-- BUSINESS MEMBERS
--
-- MVP normally has one OWNER.
-- MANAGER support is included so the data model does not need
-- redesign if a business later adds another user.
-- ============================================================

create table public.business_members (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    references public.businesses(id)
    on delete cascade,

  user_id uuid
    not null
    references auth.users(id)
    on delete cascade,

  role public.business_member_role
    not null
    default 'OWNER',

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint business_members_unique_membership
    unique (business_id, user_id)
);


-- ============================================================
-- BUSINESS SOCIAL LINKS
-- ============================================================

create table public.business_social_links (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    references public.businesses(id)
    on delete cascade,

  platform public.social_platform
    not null,

  label text,

  url text
    not null,

  sort_order integer
    not null
    default 0,

  enabled boolean
    not null
    default true,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint business_social_links_url_not_blank
    check (
      char_length(trim(url)) > 0
    ),

  constraint business_social_links_sort_order
    check (
      sort_order >= 0
    ),

  constraint business_social_links_unique_url
    unique (
      business_id,
      platform,
      url
    )
);


-- ============================================================
-- BUSINESS HOURS
--
-- day_of_week:
--   0 = Sunday
--   1 = Monday
--   ...
--   6 = Saturday
-- ============================================================

create table public.business_hours (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    references public.businesses(id)
    on delete cascade,

  day_of_week smallint
    not null,

  is_closed boolean
    not null
    default false,

  opens_at time,

  closes_at time,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint business_hours_day_range
    check (
      day_of_week between 0 and 6
    ),

  constraint business_hours_unique_day
    unique (
      business_id,
      day_of_week
    ),

  constraint business_hours_time_consistency
    check (
      (
        is_closed = true
        and opens_at is null
        and closes_at is null
      )
      or
      (
        is_closed = false
        and opens_at is not null
        and closes_at is not null
        and opens_at <> closes_at
      )
    )
);


-- ============================================================
-- PRODUCTS / SERVICES
--
-- One table supports both physical products and services.
-- ============================================================

create table public.products (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    references public.businesses(id)
    on delete cascade,

  item_type public.catalog_item_type
    not null
    default 'PRODUCT',

  name text
    not null,

  slug text
    not null,

  short_description text,

  description text,

  price_text text,

  image_url text,

  active boolean
    not null
    default true,

  featured boolean
    not null
    default false,

  sort_order integer
    not null
    default 0,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  archived_at timestamptz,

  constraint products_name_length
    check (
      char_length(trim(name)) between 1 and 160
    ),

  constraint products_slug_format
    check (
      slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),

  constraint products_slug_length
    check (
      char_length(slug) between 1 and 120
    ),

  constraint products_sort_order
    check (
      sort_order >= 0
    ),

  constraint products_unique_business_slug
    unique (
      business_id,
      slug
    )
);


-- ============================================================
-- CONTACT TEMPLATES
--
-- Business owners define messages that are prepared for the
-- public lead.
--
-- Example:
--
-- Hi {{business_name}},
-- I'm interested in {{product_name}}.
-- Could you share more information?
--
-- The lead still decides whether to send the message in the
-- destination application.
-- ============================================================

create table public.contact_templates (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    references public.businesses(id)
    on delete cascade,

  product_id uuid
    references public.products(id)
    on delete cascade,

  channel public.contact_channel
    not null,

  title text,

  message_template text
    not null,

  active boolean
    not null
    default true,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint contact_templates_message_not_blank
    check (
      char_length(trim(message_template)) > 0
    )
);


-- ============================================================
-- PUBLIC PAGE SETTINGS
-- ============================================================

create table public.public_page_settings (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    unique
    references public.businesses(id)
    on delete cascade,

  headline text,

  subheadline text,

  about_text text,

  primary_cta_text text
    not null
    default 'Get in touch',

  show_products boolean
    not null
    default true,

  show_business_hours boolean
    not null
    default true,

  show_social_links boolean
    not null
    default true,

  show_location boolean
    not null
    default true,

  show_phone boolean
    not null
    default true,

  show_email boolean
    not null
    default true,

  show_whatsapp boolean
    not null
    default true,

  lead_form_title text
    not null
    default 'Tell us what you are interested in',

  lead_form_description text,

  theme_style text
    not null
    default 'DEFAULT',

  published boolean
    not null
    default false,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now()
);


-- ============================================================
-- LEAD FORM SETTINGS
--
-- Name + phone are core LeadNexus recovery fields and remain
-- mandatory in application logic.
--
-- These settings control optional fields.
-- ============================================================

create table public.lead_form_settings (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    unique
    references public.businesses(id)
    on delete cascade,

  collect_email boolean
    not null
    default true,

  collect_location boolean
    not null
    default true,

  collect_message boolean
    not null
    default true,

  consent_text text
    not null
    default 'I agree that this business may contact me regarding my enquiry.',

  consent_text_version text
    not null
    default '1.0',

  success_message text
    not null
    default 'Thank you. Your details have been received.',

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint lead_form_settings_consent_not_blank
    check (
      char_length(trim(consent_text)) > 0
    )
);


-- ============================================================
-- TRACKING LINKS
--
-- Examples:
--   Instagram Bio
--   Instagram Solar Ad
--   Facebook Campaign
--   Google Campaign
--   QR Poster
--
-- URL may look like:
--   /l/AbC123
--
-- The redirect will preserve the campaign attribution and send
-- the lead to the selected business/product page.
-- ============================================================

create table public.tracking_links (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    references public.businesses(id)
    on delete cascade,

  product_id uuid
    references public.products(id)
    on delete set null,

  name text
    not null,

  code text
    not null
    unique,

  source text,

  medium text,

  campaign text,

  content text,

  term text,

  destination_path text,

  active boolean
    not null
    default true,

  expires_at timestamptz,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint tracking_links_name_not_blank
    check (
      char_length(trim(name)) > 0
    ),

  constraint tracking_links_code_format
    check (
      code ~ '^[A-Za-z0-9_-]{4,64}$'
    )
);


-- ============================================================
-- VISITOR SESSIONS
--
-- A visitor does NOT need a LeadNexus account.
--
-- We begin with an anonymous session and later attach that
-- session to a lead after the visitor submits the lead form.
--
-- We intentionally store an optional HASH of IP information
-- rather than requiring raw IP storage.
-- ============================================================

create table public.visitor_sessions (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    references public.businesses(id)
    on delete cascade,

  tracking_link_id uuid
    references public.tracking_links(id)
    on delete set null,

  session_token uuid
    not null
    default gen_random_uuid()
    unique,

  landing_path text,

  initial_referrer text,

  first_source text,

  first_medium text,

  first_campaign text,

  first_content text,

  first_term text,

  last_source text,

  last_medium text,

  last_campaign text,

  last_content text,

  last_term text,

  device_type text,

  browser text,

  operating_system text,

  user_agent text,

  country text,

  region text,

  city text,

  ip_hash text,

  first_seen_at timestamptz
    not null
    default now(),

  last_seen_at timestamptz
    not null
    default now(),

  last_activity_at timestamptz
    not null
    default now(),

  visit_count integer
    not null
    default 1,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint visitor_sessions_visit_count_positive
    check (
      visit_count >= 1
    )
);


-- ============================================================
-- LEADS
--
-- Core LeadNexus privacy/visibility rule:
--
--   New lead:
--     visibility = ADMIN_ONLY
--
--   If lead performs direct contact:
--     visibility = OWNER_VISIBLE
--     contact_intent = DIRECT_CONTACT
--
--   If admin reviews an abandoned high-intent lead and sends
--   it to the owner:
--     visibility = OWNER_VISIBLE
--     contact_intent = RECOVERED
--
-- RLS enforcing this is created in migration 004.
-- ============================================================

create table public.leads (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    references public.businesses(id)
    on delete cascade,

  visitor_session_id uuid
    references public.visitor_sessions(id)
    on delete set null,

  primary_product_id uuid
    references public.products(id)
    on delete set null,

  name text
    not null,

  phone text
    not null,

  phone_normalized text,

  email text,

  location_text text,

  city text,

  state text,

  country text,

  message text,

  first_source text,

  first_medium text,

  first_campaign text,

  first_content text,

  first_term text,

  last_source text,

  last_medium text,

  last_campaign text,

  last_content text,

  last_term text,

  status public.lead_status
    not null
    default 'NEW',

  visibility public.lead_visibility
    not null
    default 'ADMIN_ONLY',

  contact_intent public.lead_contact_intent
    not null
    default 'NONE',

  direct_contact_channel public.contact_channel,

  direct_contact_attempted_at timestamptz,

  owner_visible_at timestamptz,

  consent_given boolean
    not null
    default false,

  consent_text_version text,

  consent_at timestamptz,

  form_submitted_at timestamptz
    not null
    default now(),

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  archived_at timestamptz,

  constraint leads_name_length
    check (
      char_length(trim(name)) between 1 and 160
    ),

  constraint leads_phone_length
    check (
      char_length(trim(phone)) between 5 and 32
    ),

  constraint leads_email_length
    check (
      email is null
      or char_length(trim(email)) <= 320
    ),

  constraint leads_owner_visible_timestamp
    check (
      visibility <> 'OWNER_VISIBLE'
      or owner_visible_at is not null
    ),

  constraint leads_direct_contact_consistency
    check (
      contact_intent <> 'DIRECT_CONTACT'
      or (
        direct_contact_channel is not null
        and direct_contact_attempted_at is not null
      )
    )
);


-- Attach visitor session back to the captured lead.
-- This is added after leads exists to avoid circular creation
-- dependencies between visitor_sessions and leads.

alter table public.visitor_sessions
  add column lead_id uuid
    references public.leads(id)
    on delete set null;


-- ============================================================
-- ACTIVITY EVENTS
--
-- This table powers:
--
--   - Visitor journey
--   - Engagement analytics
--   - Product-interest detection
--   - Direct-contact intent
--   - AI Lead Intelligence
--   - Hot / Warm / Cold analysis
--
-- Before the form is submitted, lead_id may be null.
-- session_id allows us to connect earlier events later.
-- ============================================================

create table public.activity_events (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    references public.businesses(id)
    on delete cascade,

  session_id uuid
    not null
    references public.visitor_sessions(id)
    on delete cascade,

  lead_id uuid
    references public.leads(id)
    on delete cascade,

  product_id uuid
    references public.products(id)
    on delete set null,

  event_type public.activity_event_type
    not null,

  channel public.contact_channel,

  page_path text,

  element_key text,

  duration_ms integer,

  metadata jsonb
    not null
    default '{}'::jsonb,

  occurred_at timestamptz
    not null
    default now(),

  created_at timestamptz
    not null
    default now(),

  constraint activity_events_duration_nonnegative
    check (
      duration_ms is null
      or duration_ms >= 0
    ),

  constraint activity_events_metadata_object
    check (
      jsonb_typeof(metadata) = 'object'
    )
);


-- ============================================================
-- LEAD NOTES
-- ============================================================

create table public.lead_notes (
  id uuid primary key
    default gen_random_uuid(),

  lead_id uuid
    not null
    references public.leads(id)
    on delete cascade,

  author_user_id uuid
    references auth.users(id)
    on delete set null,

  note text
    not null,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint lead_notes_note_not_blank
    check (
      char_length(trim(note)) > 0
    )
);


-- ============================================================
-- LEAD STATUS HISTORY
--
-- Allows real funnel reporting:
--
--   NEW
--   -> CONTACTED
--   -> RESPONDED
--   -> QUALIFIED
--   -> CUSTOMER
-- ============================================================

create table public.lead_status_history (
  id uuid primary key
    default gen_random_uuid(),

  lead_id uuid
    not null
    references public.leads(id)
    on delete cascade,

  previous_status public.lead_status,

  new_status public.lead_status
    not null,

  changed_by uuid
    references auth.users(id)
    on delete set null,

  note text,

  created_at timestamptz
    not null
    default now()
);


-- ============================================================
-- LEAD INTELLIGENCE
--
-- One CURRENT intelligence record per lead.
--
-- Later analysis updates this record while audit information
-- and timestamps preserve when it changed.
--
-- Example:
--
--   score: 92
--   temperature: HOT
--   primary_interest: "5KW Solar Installation"
--   summary: "High purchase intent."
--
-- reasons:
-- [
--   "Submitted phone number",
--   "Viewed product twice",
--   "Strong engagement",
--   "Returned to the page"
-- ]
-- ============================================================

create table public.lead_intelligence (
  id uuid primary key
    default gen_random_uuid(),

  lead_id uuid
    not null
    unique
    references public.leads(id)
    on delete cascade,

  score numeric(5,2)
    not null
    default 0,

  temperature public.lead_temperature
    not null
    default 'UNKNOWN',

  primary_interest text,

  summary text,

  reasons jsonb
    not null
    default '[]'::jsonb,

  recommended_action text,

  analysis_method public.lead_analysis_method
    not null
    default 'RULES',

  activity_snapshot jsonb
    not null
    default '{}'::jsonb,

  analysis_version text
    not null
    default '1.0',

  analyzed_at timestamptz,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint lead_intelligence_score_range
    check (
      score between 0 and 100
    ),

  constraint lead_intelligence_reasons_array
    check (
      jsonb_typeof(reasons) = 'array'
    ),

  constraint lead_intelligence_snapshot_object
    check (
      jsonb_typeof(activity_snapshot) = 'object'
    )
);


-- ============================================================
-- LEAD RECOVERY REVIEWS
--
-- AI does NOT automatically reveal ADMIN_ONLY leads to the
-- business owner.
--
-- Platform admin reviews the recovered lead and chooses:
--
--   PENDING
--   SENT_TO_OWNER
--   IGNORED
-- ============================================================

create table public.lead_recovery_reviews (
  id uuid primary key
    default gen_random_uuid(),

  lead_id uuid
    not null
    unique
    references public.leads(id)
    on delete cascade,

  decision public.recovery_decision
    not null
    default 'PENDING',

  reviewed_by uuid
    references auth.users(id)
    on delete set null,

  admin_note text,

  reviewed_at timestamptz,

  sent_at timestamptz,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint lead_recovery_sent_consistency
    check (
      decision <> 'SENT_TO_OWNER'
      or sent_at is not null
    )
);


-- ============================================================
-- SEO SETTINGS
--
-- SEO is intentionally separate from AI Lead Intelligence.
--
-- SEO = public business-page discoverability.
-- Lead Intelligence = visitor behavior / purchase intent.
-- ============================================================

create table public.seo_settings (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    unique
    references public.businesses(id)
    on delete cascade,

  seo_title text,

  meta_description text,

  keywords text[],

  canonical_override text,

  og_title text,

  og_description text,

  og_image_url text,

  allow_indexing boolean
    not null
    default true,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint seo_settings_title_length
    check (
      seo_title is null
      or char_length(seo_title) <= 120
    ),

  constraint seo_settings_description_length
    check (
      meta_description is null
      or char_length(meta_description) <= 500
    )
);


-- ============================================================
-- INTEGRATION CONNECTIONS
--
-- Generic integration registry.
--
-- We do NOT store raw external API secrets here.
-- Secrets stay in server-side environment / secure secret
-- storage.
--
-- Future examples:
--   - VoiceNexus
--   - Google Search Console
--   - Meta WhatsApp
-- ============================================================

create table public.integration_connections (
  id uuid primary key
    default gen_random_uuid(),

  business_id uuid
    not null
    references public.businesses(id)
    on delete cascade,

  provider public.integration_provider
    not null,

  status public.integration_status
    not null
    default 'DISCONNECTED',

  external_account_id text,

  configuration jsonb
    not null
    default '{}'::jsonb,

  last_synced_at timestamptz,

  connected_at timestamptz,

  disconnected_at timestamptz,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint integration_connections_configuration_object
    check (
      jsonb_typeof(configuration) = 'object'
    ),

  constraint integration_connections_unique_provider
    unique (
      business_id,
      provider
    )
);


-- ============================================================
-- OUTBOX EVENTS
--
-- Reliable future integration handoff.
--
-- Example later:
--
-- event_type:
--   "lead.owner_visible"
--
-- aggregate_type:
--   "lead"
--
-- aggregate_id:
--   <lead uuid>
--
-- payload:
-- {
--   "leadId": "...",
--   "businessId": "...",
--   "name": "...",
--   "phone": "...",
--   "primaryInterest": "...",
--   "activitySummary": ...
-- }
--
-- A future VoiceNexus integration can consume approved events
-- without putting calling logic into LeadNexus itself.
-- ============================================================

create table public.outbox_events (
  id uuid primary key
    default gen_random_uuid(),

  event_type text
    not null,

  aggregate_type text
    not null,

  aggregate_id uuid,

  payload jsonb
    not null
    default '{}'::jsonb,

  status public.outbox_status
    not null
    default 'PENDING',

  idempotency_key text
    unique,

  attempt_count integer
    not null
    default 0,

  last_error text,

  available_at timestamptz
    not null
    default now(),

  processed_at timestamptz,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint outbox_events_event_type_not_blank
    check (
      char_length(trim(event_type)) > 0
    ),

  constraint outbox_events_aggregate_type_not_blank
    check (
      char_length(trim(aggregate_type)) > 0
    ),

  constraint outbox_events_payload_object
    check (
      jsonb_typeof(payload) = 'object'
    ),

  constraint outbox_events_attempt_count_nonnegative
    check (
      attempt_count >= 0
    )
);


-- ============================================================
-- AUDIT LOGS
--
-- Examples:
--
--   ADMIN_SENT_LEAD_TO_OWNER
--   ADMIN_IGNORED_RECOVERY
--   OWNER_CHANGED_LEAD_STATUS
--   BUSINESS_UPDATED
--   PRODUCT_CREATED
--   PRODUCT_ARCHIVED
-- ============================================================

create table public.audit_logs (
  id uuid primary key
    default gen_random_uuid(),

  actor_user_id uuid
    references auth.users(id)
    on delete set null,

  action text
    not null,

  entity_type text
    not null,

  entity_id uuid,

  metadata jsonb
    not null
    default '{}'::jsonb,

  created_at timestamptz
    not null
    default now(),

  constraint audit_logs_action_not_blank
    check (
      char_length(trim(action)) > 0
    ),

  constraint audit_logs_entity_type_not_blank
    check (
      char_length(trim(entity_type)) > 0
    ),

  constraint audit_logs_metadata_object
    check (
      jsonb_typeof(metadata) = 'object'
    )
);


-- ============================================================
-- SCHEMA COMMENTS
-- ============================================================

comment on table public.profiles is
  'Authenticated LeadNexus user profiles and platform-level roles.';


comment on table public.businesses is
  'Businesses onboarded onto LeadNexus.';


comment on table public.business_members is
  'Maps authenticated users to businesses as owners or managers.';


comment on table public.products is
  'Products and services listed on business public pages.';


comment on table public.contact_templates is
  'Business-configured pre-filled contact messages for leads.';


comment on table public.tracking_links is
  'Trackable campaign links used for attribution and advertising.';


comment on table public.visitor_sessions is
  'Anonymous visitor sessions that can later be attached to captured leads.';


comment on table public.activity_events is
  'Visitor behavior events used for analytics and Lead Intelligence.';


comment on table public.leads is
  'Captured lead contact details, attribution, visibility and conversion status.';


comment on table public.lead_intelligence is
  'Current LeadNexus rules/AI intent analysis for each lead.';


comment on table public.lead_recovery_reviews is
  'Platform-admin review workflow for interested leads that did not complete direct contact.';


comment on table public.seo_settings is
  'Search engine metadata for public business pages.';


comment on table public.integration_connections is
  'Non-secret integration connection metadata.';


comment on table public.outbox_events is
  'Reliable event outbox for future external integrations such as VoiceNexus.';


comment on table public.audit_logs is
  'Security and business-action audit trail.';