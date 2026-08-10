-- ============================================================
-- LeadNexus
-- Migration: 002_database_functions.sql
--
-- Purpose:
--   Core database functions and triggers used by LeadNexus.
--
-- Includes:
--   - Automatic profile creation after Supabase signup
--   - Automatic updated_at timestamps
--   - Business default configuration creation
--   - Business owner membership creation
--   - Lead attribution from visitor sessions
--   - Lead/session/activity linking
--   - Visitor session activity timestamps
--   - Direct-contact detection
--   - Lead status history
--   - Lead Intelligence base record creation
--   - Platform admin helper functions
--   - Business membership helper functions
--   - Atomic lead recovery actions
--
-- IMPORTANT:
--   RLS itself is added in:
--     004_rls_policies.sql
--
--   This migration does NOT expose private lead information
--   to business owners by itself.
-- ============================================================


-- ============================================================
-- HELPER
-- UPDATED_AT
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();

  return new;
end;
$$;


-- ============================================================
-- NORMALIZE PHONE
--
-- Keeps:
--   digits
--   optional leading +
--
-- Examples:
--
--   "+91 98765 43210"
--     -> "+919876543210"
--
--   "98765-43210"
--     -> "9876543210"
--
-- This is intentionally simple.
-- Country-code interpretation belongs to application logic.
-- ============================================================

create or replace function public.normalize_phone(
  phone_value text
)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  normalized text;
  has_plus boolean;
begin
  if phone_value is null then
    return null;
  end if;

  has_plus := left(trim(phone_value), 1) = '+';

  normalized :=
    regexp_replace(
      phone_value,
      '[^0-9]',
      '',
      'g'
    );

  if normalized = '' then
    return null;
  end if;

  if has_plus then
    return '+' || normalized;
  end if;

  return normalized;
end;
$$;


-- ============================================================
-- AUTH USER -> PROFILE
--
-- Supabase Auth stores authenticated identities in auth.users.
--
-- We maintain our own public.profiles table because application
-- data should reference a public application-owned profile
-- rather than query auth.users from the frontend.
--
-- Supported signup metadata:
--
--   full_name
--   name
--
-- Phone priority:
--
--   auth.users.phone
--   -> raw_user_meta_data.phone
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_name text;
  resolved_phone text;
begin
  resolved_name :=
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    );

  resolved_phone :=
    nullif(
      trim(
        coalesce(
          new.phone,
          new.raw_user_meta_data ->> 'phone',
          ''
        )
      ),
      ''
    );

  insert into public.profiles (
    id,
    full_name,
    phone
  )
  values (
    new.id,
    resolved_name,
    resolved_phone
  )
  on conflict (id)
  do nothing;

  return new;
end;
$$;


drop trigger if exists
  on_auth_user_created
  on auth.users;


create trigger on_auth_user_created
after insert
on auth.users
for each row
execute function public.handle_new_user();


-- ============================================================
-- AUTH USER UPDATE -> PROFILE SYNC
--
-- We intentionally synchronize only basic identity information.
--
-- platform_role is NEVER copied from user metadata.
-- A user must never be able to promote themselves to
-- PLATFORM_ADMIN using signup/account metadata.
-- ============================================================

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_name text;
  resolved_phone text;
begin
  resolved_name :=
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    );

  resolved_phone :=
    nullif(
      trim(
        coalesce(
          new.phone,
          new.raw_user_meta_data ->> 'phone',
          ''
        )
      ),
      ''
    );

  update public.profiles
  set
    full_name =
      coalesce(
        resolved_name,
        full_name
      ),

    phone =
      coalesce(
        resolved_phone,
        phone
      ),

    updated_at = now()

  where id = new.id;

  return new;
end;
$$;


drop trigger if exists
  on_auth_user_updated
  on auth.users;


create trigger on_auth_user_updated
after update of
  raw_user_meta_data,
  phone
on auth.users
for each row
execute function public.handle_auth_user_updated();


-- ============================================================
-- PLATFORM ADMIN HELPER
--
-- Used later by RLS and atomic admin operations.
--
-- SECURITY DEFINER is necessary because the function must
-- inspect profiles even when the caller's RLS policies would
-- otherwise restrict that table.
--
-- It answers only:
--   true / false
--
-- No private profile information is returned.
-- ============================================================

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where
      id = (select auth.uid())
      and platform_role = 'PLATFORM_ADMIN'
  );
$$;


-- ============================================================
-- BUSINESS MEMBERSHIP HELPER
--
-- Answers whether the currently authenticated user belongs to
-- the supplied business.
-- ============================================================

create or replace function public.is_business_member(
  target_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members
    where
      business_id = target_business_id
      and user_id = (select auth.uid())
  );
$$;


-- ============================================================
-- BUSINESS OWNER HELPER
-- ============================================================

create or replace function public.is_business_owner(
  target_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members
    where
      business_id = target_business_id
      and user_id = (select auth.uid())
      and role = 'OWNER'
  );
$$;


-- ============================================================
-- BUSINESS OWNER / MANAGER HELPER
--
-- For the current MVP both OWNER and MANAGER are allowed to
-- operate the business workspace.
-- ============================================================

create or replace function public.can_manage_business(
  target_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_members
    where
      business_id = target_business_id
      and user_id = (select auth.uid())
      and role in ('OWNER', 'MANAGER')
  );
$$;


-- ============================================================
-- BUSINESS CREATION DEFAULTS
--
-- When a new business is created:
--
-- 1. Creator becomes OWNER.
--
-- 2. public_page_settings is initialized.
--
-- 3. lead_form_settings is initialized.
--
-- 4. seo_settings is initialized.
--
-- 5. Seven business-hour rows are initialized as closed.
--
-- These are actual configuration rows, not fake/demo data.
-- ============================================================

create or replace function public.handle_new_business()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  day_number integer;
begin

  -- ----------------------------------------------------------
  -- OWNER MEMBERSHIP
  -- ----------------------------------------------------------

  if new.created_by is not null then

    insert into public.business_members (
      business_id,
      user_id,
      role
    )
    values (
      new.id,
      new.created_by,
      'OWNER'
    )
    on conflict (
      business_id,
      user_id
    )
    do nothing;

  end if;


  -- ----------------------------------------------------------
  -- PUBLIC PAGE SETTINGS
  -- ----------------------------------------------------------

  insert into public.public_page_settings (
    business_id
  )
  values (
    new.id
  )
  on conflict (business_id)
  do nothing;


  -- ----------------------------------------------------------
  -- LEAD FORM SETTINGS
  -- ----------------------------------------------------------

  insert into public.lead_form_settings (
    business_id
  )
  values (
    new.id
  )
  on conflict (business_id)
  do nothing;


  -- ----------------------------------------------------------
  -- SEO SETTINGS
  -- ----------------------------------------------------------

  insert into public.seo_settings (
    business_id
  )
  values (
    new.id
  )
  on conflict (business_id)
  do nothing;


  -- ----------------------------------------------------------
  -- BUSINESS HOURS
  --
  -- Start closed.
  -- Owner explicitly configures operating hours later.
  -- ----------------------------------------------------------

  for day_number in 0..6 loop

    insert into public.business_hours (
      business_id,
      day_of_week,
      is_closed
    )
    values (
      new.id,
      day_number,
      true
    )
    on conflict (
      business_id,
      day_of_week
    )
    do nothing;

  end loop;


  return new;
end;
$$;


drop trigger if exists
  on_business_created
  on public.businesses;


create trigger on_business_created
after insert
on public.businesses
for each row
execute function public.handle_new_business();


-- ============================================================
-- LEAD BEFORE INSERT
--
-- Responsibilities:
--
-- - Normalize the phone number.
--
-- - Pull missing attribution information from visitor session.
--
-- - Pull missing primary product from tracking link.
--
-- - Ensure business/session relationship is valid.
--
-- This helps prevent attribution from being lost if the
-- frontend does not duplicate every UTM value into the form.
-- ============================================================

create or replace function public.prepare_new_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_record public.visitor_sessions%rowtype;
  tracked_product_id uuid;
begin

  -- ----------------------------------------------------------
  -- PHONE NORMALIZATION
  -- ----------------------------------------------------------

  new.phone_normalized :=
    public.normalize_phone(new.phone);


  -- ----------------------------------------------------------
  -- VISITOR SESSION
  -- ----------------------------------------------------------

  if new.visitor_session_id is not null then

    select *
    into session_record
    from public.visitor_sessions
    where id = new.visitor_session_id;

    if not found then
      raise exception
        'Visitor session does not exist.';
    end if;


    if session_record.business_id <> new.business_id then
      raise exception
        'Visitor session does not belong to this business.';
    end if;


    -- --------------------------------------------------------
    -- FIRST TOUCH
    -- --------------------------------------------------------

    new.first_source :=
      coalesce(
        new.first_source,
        session_record.first_source
      );

    new.first_medium :=
      coalesce(
        new.first_medium,
        session_record.first_medium
      );

    new.first_campaign :=
      coalesce(
        new.first_campaign,
        session_record.first_campaign
      );

    new.first_content :=
      coalesce(
        new.first_content,
        session_record.first_content
      );

    new.first_term :=
      coalesce(
        new.first_term,
        session_record.first_term
      );


    -- --------------------------------------------------------
    -- LAST TOUCH
    -- --------------------------------------------------------

    new.last_source :=
      coalesce(
        new.last_source,
        session_record.last_source,
        session_record.first_source
      );

    new.last_medium :=
      coalesce(
        new.last_medium,
        session_record.last_medium,
        session_record.first_medium
      );

    new.last_campaign :=
      coalesce(
        new.last_campaign,
        session_record.last_campaign,
        session_record.first_campaign
      );

    new.last_content :=
      coalesce(
        new.last_content,
        session_record.last_content,
        session_record.first_content
      );

    new.last_term :=
      coalesce(
        new.last_term,
        session_record.last_term,
        session_record.first_term
      );


    -- --------------------------------------------------------
    -- TRACKING LINK PRODUCT
    -- --------------------------------------------------------

    if
      new.primary_product_id is null
      and session_record.tracking_link_id is not null
    then

      select product_id
      into tracked_product_id
      from public.tracking_links
      where id = session_record.tracking_link_id;

      new.primary_product_id :=
        tracked_product_id;

    end if;

  end if;


  -- ----------------------------------------------------------
  -- OWNER_VISIBLE TIMESTAMP CONSISTENCY
  -- ----------------------------------------------------------

  if
    new.visibility = 'OWNER_VISIBLE'
    and new.owner_visible_at is null
  then
    new.owner_visible_at := now();
  end if;


  return new;
end;
$$;


drop trigger if exists
  before_lead_created
  on public.leads;


create trigger before_lead_created
before insert
on public.leads
for each row
execute function public.prepare_new_lead();


-- ============================================================
-- LEAD BEFORE UPDATE
--
-- Responsibilities:
--
-- - Keep phone_normalized synchronized.
--
-- - Automatically set owner_visible_at when visibility changes.
--
-- - Prevent owner_visible_at from disappearing after exposure.
-- ============================================================

create or replace function public.prepare_lead_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin

  if new.phone is distinct from old.phone then

    new.phone_normalized :=
      public.normalize_phone(new.phone);

  end if;


  if
    new.visibility = 'OWNER_VISIBLE'
    and old.visibility <> 'OWNER_VISIBLE'
    and new.owner_visible_at is null
  then

    new.owner_visible_at := now();

  end if;


  if
    old.owner_visible_at is not null
    and new.owner_visible_at is null
  then

    new.owner_visible_at :=
      old.owner_visible_at;

  end if;


  return new;
end;
$$;


drop trigger if exists
  before_lead_updated
  on public.leads;


create trigger before_lead_updated
before update
on public.leads
for each row
execute function public.prepare_lead_update();


-- ============================================================
-- LEAD CREATED
--
-- Responsibilities:
--
-- 1. Attach visitor session to lead.
--
-- 2. Attach ALL previous anonymous activity in the same
--    visitor session to that lead.
--
-- 3. Create initial Lead Intelligence row.
--
-- 4. If the visitor already performed a contact action BEFORE
--    submitting the form, expose the lead to the owner and mark
--    DIRECT_CONTACT.
--
-- This allows this journey to work correctly:
--
--   Visitor
--       -> product
--       -> WhatsApp click
--       -> returns
--       -> submits LeadNexus form
--
-- Earlier anonymous behavior becomes part of the lead journey.
-- ============================================================

create or replace function public.handle_new_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest_contact public.activity_events%rowtype;
begin

  -- ----------------------------------------------------------
  -- ATTACH SESSION
  -- ----------------------------------------------------------

  if new.visitor_session_id is not null then

    update public.visitor_sessions
    set
      lead_id = new.id,
      updated_at = now()
    where
      id = new.visitor_session_id
      and business_id = new.business_id;


    -- --------------------------------------------------------
    -- BACKFILL PREVIOUS ACTIVITY
    -- --------------------------------------------------------

    update public.activity_events
    set lead_id = new.id
    where
      session_id = new.visitor_session_id
      and business_id = new.business_id
      and lead_id is null;


    -- --------------------------------------------------------
    -- CHECK PREVIOUS CONTACT ACTION
    -- --------------------------------------------------------

    select *
    into latest_contact
    from public.activity_events
    where
      session_id = new.visitor_session_id
      and business_id = new.business_id
      and event_type in (
        'WHATSAPP_CLICK',
        'INSTAGRAM_CLICK',
        'FACEBOOK_CLICK',
        'LINKEDIN_CLICK',
        'PHONE_CLICK',
        'EMAIL_CLICK',
        'WEBSITE_CLICK'
      )
    order by occurred_at desc
    limit 1;


    if found then

      update public.leads
      set
        visibility = 'OWNER_VISIBLE',

        contact_intent = 'DIRECT_CONTACT',

        direct_contact_channel =
          case latest_contact.event_type

            when 'WHATSAPP_CLICK'
              then 'WHATSAPP'::public.contact_channel

            when 'INSTAGRAM_CLICK'
              then 'INSTAGRAM'::public.contact_channel

            when 'FACEBOOK_CLICK'
              then 'FACEBOOK'::public.contact_channel

            when 'LINKEDIN_CLICK'
              then 'LINKEDIN'::public.contact_channel

            when 'PHONE_CLICK'
              then 'PHONE'::public.contact_channel

            when 'EMAIL_CLICK'
              then 'EMAIL'::public.contact_channel

            when 'WEBSITE_CLICK'
              then 'WEBSITE'::public.contact_channel

            else null

          end,

        direct_contact_attempted_at =
          latest_contact.occurred_at,

        owner_visible_at =
          coalesce(
            owner_visible_at,
            now()
          ),

        updated_at = now()

      where id = new.id;

    end if;

  end if;


  -- ----------------------------------------------------------
  -- INITIAL INTELLIGENCE RECORD
  -- ----------------------------------------------------------

  insert into public.lead_intelligence (
    lead_id,
    score,
    temperature,
    analysis_method,
    activity_snapshot
  )
  values (
    new.id,
    0,
    'UNKNOWN',
    'RULES',
    '{}'::jsonb
  )
  on conflict (lead_id)
  do nothing;


  return new;
end;
$$;


drop trigger if exists
  after_lead_created
  on public.leads;


create trigger after_lead_created
after insert
on public.leads
for each row
execute function public.handle_new_lead();


-- ============================================================
-- ACTIVITY EVENT BEFORE INSERT
--
-- If the event is recorded after a visitor already became a
-- lead, automatically attach the lead_id using the session.
--
-- Also validates that the event belongs to the same business
-- as the visitor session.
-- ============================================================

create or replace function public.prepare_activity_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  session_business_id uuid;
  session_lead_id uuid;
begin

  select
    business_id,
    lead_id

  into
    session_business_id,
    session_lead_id

  from public.visitor_sessions

  where id = new.session_id;


  if not found then

    raise exception
      'Visitor session does not exist.';

  end if;


  if session_business_id <> new.business_id then

    raise exception
      'Activity event business does not match visitor session business.';

  end if;


  if
    new.lead_id is null
    and session_lead_id is not null
  then

    new.lead_id :=
      session_lead_id;

  end if;


  if new.lead_id is not null then

    if not exists (
      select 1
      from public.leads
      where
        id = new.lead_id
        and business_id = new.business_id
    )
    then

      raise exception
        'Lead does not belong to activity business.';

    end if;

  end if;


  if new.product_id is not null then

    if not exists (
      select 1
      from public.products
      where
        id = new.product_id
        and business_id = new.business_id
    )
    then

      raise exception
        'Product does not belong to activity business.';

    end if;

  end if;


  return new;
end;
$$;


drop trigger if exists
  before_activity_event_created
  on public.activity_events;


create trigger before_activity_event_created
before insert
on public.activity_events
for each row
execute function public.prepare_activity_event();


-- ============================================================
-- ACTIVITY EVENT AFTER INSERT
--
-- Responsibilities:
--
-- 1. Keep visitor-session activity timestamps fresh.
--
-- 2. Increase visit_count for RETURN_VISIT.
--
-- 3. Mark direct-contact intent if a known lead clicks a
--    contact channel.
--
-- IMPORTANT:
--
-- A click means CONTACT INTENT.
--
-- LeadNexus does NOT claim:
--
--   WhatsApp message sent
--   Instagram message sent
--   Business replied
--   Conversation completed
--
-- unless a future official integration confirms those events.
-- ============================================================

create or replace function public.handle_activity_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_channel public.contact_channel;
begin

  -- ----------------------------------------------------------
  -- TOUCH SESSION
  -- ----------------------------------------------------------

  update public.visitor_sessions
  set
    last_activity_at =
      greatest(
        last_activity_at,
        new.occurred_at
      ),

    last_seen_at =
      greatest(
        last_seen_at,
        new.occurred_at
      ),

    visit_count =
      case
        when new.event_type = 'RETURN_VISIT'
          then visit_count + 1
        else visit_count
      end,

    updated_at = now()

  where id = new.session_id;


  -- ----------------------------------------------------------
  -- RESOLVE CONTACT CHANNEL
  -- ----------------------------------------------------------

  resolved_channel :=
    case new.event_type

      when 'WHATSAPP_CLICK'
        then 'WHATSAPP'::public.contact_channel

      when 'INSTAGRAM_CLICK'
        then 'INSTAGRAM'::public.contact_channel

      when 'FACEBOOK_CLICK'
        then 'FACEBOOK'::public.contact_channel

      when 'LINKEDIN_CLICK'
        then 'LINKEDIN'::public.contact_channel

      when 'PHONE_CLICK'
        then 'PHONE'::public.contact_channel

      when 'EMAIL_CLICK'
        then 'EMAIL'::public.contact_channel

      when 'WEBSITE_CLICK'
        then 'WEBSITE'::public.contact_channel

      else null

    end;


  -- ----------------------------------------------------------
  -- DIRECT CONTACT INTENT
  -- ----------------------------------------------------------

  if
    new.lead_id is not null
    and resolved_channel is not null
  then

    update public.leads
    set
      visibility = 'OWNER_VISIBLE',

      contact_intent = 'DIRECT_CONTACT',

      direct_contact_channel =
        resolved_channel,

      direct_contact_attempted_at =
        new.occurred_at,

      owner_visible_at =
        coalesce(
          owner_visible_at,
          now()
        ),

      updated_at = now()

    where
      id = new.lead_id
      and business_id = new.business_id;

  end if;


  return new;
end;
$$;


drop trigger if exists
  after_activity_event_created
  on public.activity_events;


create trigger after_activity_event_created
after insert
on public.activity_events
for each row
execute function public.handle_activity_event();


-- ============================================================
-- LEAD STATUS HISTORY
--
-- Create history row on initial lead creation.
-- ============================================================

create or replace function public.handle_initial_lead_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  insert into public.lead_status_history (
    lead_id,
    previous_status,
    new_status,
    changed_by
  )
  values (
    new.id,
    null,
    new.status,
    (select auth.uid())
  );

  return new;
end;
$$;


drop trigger if exists
  after_initial_lead_status
  on public.leads;


create trigger after_initial_lead_status
after insert
on public.leads
for each row
execute function public.handle_initial_lead_status();


-- ============================================================
-- LEAD STATUS CHANGE HISTORY
-- ============================================================

create or replace function public.handle_lead_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  if new.status is distinct from old.status then

    insert into public.lead_status_history (
      lead_id,
      previous_status,
      new_status,
      changed_by
    )
    values (
      new.id,
      old.status,
      new.status,
      (select auth.uid())
    );

  end if;

  return new;
end;
$$;


drop trigger if exists
  after_lead_status_changed
  on public.leads;


create trigger after_lead_status_changed
after update of status
on public.leads
for each row
execute function public.handle_lead_status_change();


-- ============================================================
-- ADMIN: SEND RECOVERED LEAD TO BUSINESS OWNER
--
-- Atomic operation:
--
--   1. Verify authenticated caller is PLATFORM_ADMIN.
--
--   2. Verify lead exists.
--
--   3. Make lead OWNER_VISIBLE.
--
--   4. Mark contact_intent = RECOVERED unless it already has
--      DIRECT_CONTACT.
--
--   5. Create/update recovery review.
--
--   6. Write audit log.
--
--   7. Create future integration outbox event.
--
-- DIRECT_CONTACT always takes precedence over RECOVERED.
-- ============================================================

create or replace function public.send_recovered_lead_to_owner(
  target_lead_id uuid,
  admin_note_value text default null
)
returns public.leads
language plpgsql
security definer
set search_path = ''
as $$
declare
  lead_record public.leads%rowtype;
begin

  -- ----------------------------------------------------------
  -- ADMIN CHECK
  -- ----------------------------------------------------------

  if not public.is_platform_admin() then

    raise exception
      'Only a platform administrator can send recovered leads.';

  end if;


  -- ----------------------------------------------------------
  -- LOCK LEAD
  -- ----------------------------------------------------------

  select *
  into lead_record
  from public.leads
  where id = target_lead_id
  for update;


  if not found then

    raise exception
      'Lead not found.';

  end if;


  -- ----------------------------------------------------------
  -- UPDATE LEAD
  -- ----------------------------------------------------------

  update public.leads
  set
    visibility = 'OWNER_VISIBLE',

    contact_intent =
      case
        when contact_intent = 'DIRECT_CONTACT'
          then 'DIRECT_CONTACT'::public.lead_contact_intent
        else
          'RECOVERED'::public.lead_contact_intent
      end,

    owner_visible_at =
      coalesce(
        owner_visible_at,
        now()
      ),

    updated_at = now()

  where id = target_lead_id

  returning *
  into lead_record;


  -- ----------------------------------------------------------
  -- RECOVERY REVIEW
  -- ----------------------------------------------------------

  insert into public.lead_recovery_reviews (
    lead_id,
    decision,
    reviewed_by,
    admin_note,
    reviewed_at,
    sent_at
  )
  values (
    target_lead_id,
    'SENT_TO_OWNER',
    (select auth.uid()),
    admin_note_value,
    now(),
    now()
  )

  on conflict (lead_id)

  do update
  set
    decision = 'SENT_TO_OWNER',
    reviewed_by = excluded.reviewed_by,
    admin_note =
      coalesce(
        excluded.admin_note,
        public.lead_recovery_reviews.admin_note
      ),
    reviewed_at = excluded.reviewed_at,
    sent_at = excluded.sent_at,
    updated_at = now();


  -- ----------------------------------------------------------
  -- AUDIT LOG
  -- ----------------------------------------------------------

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    (select auth.uid()),
    'ADMIN_SENT_LEAD_TO_OWNER',
    'lead',
    target_lead_id,
    jsonb_build_object(
      'business_id',
      lead_record.business_id,

      'previous_contact_intent',
      lead_record.contact_intent,

      'admin_note',
      admin_note_value
    )
  );


  -- ----------------------------------------------------------
  -- OUTBOX EVENT
  --
  -- No VoiceNexus call is made here.
  --
  -- This only creates an integration-ready database event.
  -- ----------------------------------------------------------

  insert into public.outbox_events (
    event_type,
    aggregate_type,
    aggregate_id,
    payload,
    idempotency_key
  )
  values (
    'lead.owner_visible',
    'lead',
    target_lead_id,

    jsonb_build_object(
      'lead_id',
      target_lead_id,

      'business_id',
      lead_record.business_id,

      'visibility',
      'OWNER_VISIBLE',

      'contact_intent',
      lead_record.contact_intent
    ),

    'lead.owner_visible:' || target_lead_id::text
  )

  on conflict (idempotency_key)
  do nothing;


  return lead_record;
end;
$$;


-- ============================================================
-- ADMIN: IGNORE RECOVERY CANDIDATE
-- ============================================================

create or replace function public.ignore_recovered_lead(
  target_lead_id uuid,
  admin_note_value text default null
)
returns public.lead_recovery_reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  review_record public.lead_recovery_reviews%rowtype;
  target_business_id uuid;
begin

  if not public.is_platform_admin() then

    raise exception
      'Only a platform administrator can review recovered leads.';

  end if;


  select business_id
  into target_business_id
  from public.leads
  where id = target_lead_id;


  if not found then

    raise exception
      'Lead not found.';

  end if;


  insert into public.lead_recovery_reviews (
    lead_id,
    decision,
    reviewed_by,
    admin_note,
    reviewed_at
  )
  values (
    target_lead_id,
    'IGNORED',
    (select auth.uid()),
    admin_note_value,
    now()
  )

  on conflict (lead_id)

  do update
  set
    decision = 'IGNORED',
    reviewed_by = excluded.reviewed_by,
    admin_note =
      coalesce(
        excluded.admin_note,
        public.lead_recovery_reviews.admin_note
      ),
    reviewed_at = excluded.reviewed_at,
    sent_at = null,
    updated_at = now()

  returning *
  into review_record;


  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    (select auth.uid()),
    'ADMIN_IGNORED_RECOVERY',
    'lead',
    target_lead_id,

    jsonb_build_object(
      'business_id',
      target_business_id,
      'admin_note',
      admin_note_value
    )
  );


  return review_record;
end;
$$;


-- ============================================================
-- CREATE UPDATED_AT TRIGGERS
-- ============================================================


-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------

drop trigger if exists
  set_profiles_updated_at
  on public.profiles;

create trigger set_profiles_updated_at
before update
on public.profiles
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- BUSINESSES
-- ------------------------------------------------------------

drop trigger if exists
  set_businesses_updated_at
  on public.businesses;

create trigger set_businesses_updated_at
before update
on public.businesses
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- BUSINESS MEMBERS
-- ------------------------------------------------------------

drop trigger if exists
  set_business_members_updated_at
  on public.business_members;

create trigger set_business_members_updated_at
before update
on public.business_members
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- BUSINESS SOCIAL LINKS
-- ------------------------------------------------------------

drop trigger if exists
  set_business_social_links_updated_at
  on public.business_social_links;

create trigger set_business_social_links_updated_at
before update
on public.business_social_links
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- BUSINESS HOURS
-- ------------------------------------------------------------

drop trigger if exists
  set_business_hours_updated_at
  on public.business_hours;

create trigger set_business_hours_updated_at
before update
on public.business_hours
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------

drop trigger if exists
  set_products_updated_at
  on public.products;

create trigger set_products_updated_at
before update
on public.products
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- CONTACT TEMPLATES
-- ------------------------------------------------------------

drop trigger if exists
  set_contact_templates_updated_at
  on public.contact_templates;

create trigger set_contact_templates_updated_at
before update
on public.contact_templates
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- PUBLIC PAGE SETTINGS
-- ------------------------------------------------------------

drop trigger if exists
  set_public_page_settings_updated_at
  on public.public_page_settings;

create trigger set_public_page_settings_updated_at
before update
on public.public_page_settings
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- LEAD FORM SETTINGS
-- ------------------------------------------------------------

drop trigger if exists
  set_lead_form_settings_updated_at
  on public.lead_form_settings;

create trigger set_lead_form_settings_updated_at
before update
on public.lead_form_settings
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- TRACKING LINKS
-- ------------------------------------------------------------

drop trigger if exists
  set_tracking_links_updated_at
  on public.tracking_links;

create trigger set_tracking_links_updated_at
before update
on public.tracking_links
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- VISITOR SESSIONS
-- ------------------------------------------------------------

drop trigger if exists
  set_visitor_sessions_updated_at
  on public.visitor_sessions;

create trigger set_visitor_sessions_updated_at
before update
on public.visitor_sessions
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- LEADS
-- ------------------------------------------------------------

drop trigger if exists
  set_leads_updated_at
  on public.leads;

create trigger set_leads_updated_at
before update
on public.leads
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- LEAD NOTES
-- ------------------------------------------------------------

drop trigger if exists
  set_lead_notes_updated_at
  on public.lead_notes;

create trigger set_lead_notes_updated_at
before update
on public.lead_notes
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- LEAD INTELLIGENCE
-- ------------------------------------------------------------

drop trigger if exists
  set_lead_intelligence_updated_at
  on public.lead_intelligence;

create trigger set_lead_intelligence_updated_at
before update
on public.lead_intelligence
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- LEAD RECOVERY REVIEWS
-- ------------------------------------------------------------

drop trigger if exists
  set_lead_recovery_reviews_updated_at
  on public.lead_recovery_reviews;

create trigger set_lead_recovery_reviews_updated_at
before update
on public.lead_recovery_reviews
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- SEO SETTINGS
-- ------------------------------------------------------------

drop trigger if exists
  set_seo_settings_updated_at
  on public.seo_settings;

create trigger set_seo_settings_updated_at
before update
on public.seo_settings
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- INTEGRATION CONNECTIONS
-- ------------------------------------------------------------

drop trigger if exists
  set_integration_connections_updated_at
  on public.integration_connections;

create trigger set_integration_connections_updated_at
before update
on public.integration_connections
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- OUTBOX EVENTS
-- ------------------------------------------------------------

drop trigger if exists
  set_outbox_events_updated_at
  on public.outbox_events;

create trigger set_outbox_events_updated_at
before update
on public.outbox_events
for each row
execute function public.set_updated_at();


-- ============================================================
-- FUNCTION PRIVILEGES
--
-- Supabase/Postgres functions can otherwise inherit broad
-- EXECUTE permissions.
--
-- Trigger/internal functions should not be callable through the
-- Data API by normal users.
--
-- Public authenticated helper functions receive only the
-- permissions they actually require.
-- ============================================================


-- ============================================================
-- INTERNAL / TRIGGER FUNCTIONS
-- ============================================================

revoke execute
on function public.set_updated_at()
from public, anon, authenticated;


revoke execute
on function public.handle_new_user()
from public, anon, authenticated;


revoke execute
on function public.handle_auth_user_updated()
from public, anon, authenticated;


revoke execute
on function public.handle_new_business()
from public, anon, authenticated;


revoke execute
on function public.prepare_new_lead()
from public, anon, authenticated;


revoke execute
on function public.prepare_lead_update()
from public, anon, authenticated;


revoke execute
on function public.handle_new_lead()
from public, anon, authenticated;


revoke execute
on function public.prepare_activity_event()
from public, anon, authenticated;


revoke execute
on function public.handle_activity_event()
from public, anon, authenticated;


revoke execute
on function public.handle_initial_lead_status()
from public, anon, authenticated;


revoke execute
on function public.handle_lead_status_change()
from public, anon, authenticated;


-- ============================================================
-- PHONE NORMALIZER
--
-- Safe utility.
-- Application and authenticated code may use it.
-- Anonymous direct access is unnecessary.
-- ============================================================

revoke execute
on function public.normalize_phone(text)
from public, anon;


grant execute
on function public.normalize_phone(text)
to authenticated;


-- ============================================================
-- RLS HELPERS
-- ============================================================

revoke execute
on function public.is_platform_admin()
from public, anon;


grant execute
on function public.is_platform_admin()
to authenticated;


revoke execute
on function public.is_business_member(uuid)
from public, anon;


grant execute
on function public.is_business_member(uuid)
to authenticated;


revoke execute
on function public.is_business_owner(uuid)
from public, anon;


grant execute
on function public.is_business_owner(uuid)
to authenticated;


revoke execute
on function public.can_manage_business(uuid)
from public, anon;


grant execute
on function public.can_manage_business(uuid)
to authenticated;


-- ============================================================
-- ADMIN RECOVERY FUNCTIONS
--
-- Callable only by authenticated users.
--
-- The functions themselves still verify PLATFORM_ADMIN.
-- ============================================================

revoke execute
on function public.send_recovered_lead_to_owner(uuid, text)
from public, anon;


grant execute
on function public.send_recovered_lead_to_owner(uuid, text)
to authenticated;


revoke execute
on function public.ignore_recovered_lead(uuid, text)
from public, anon;


grant execute
on function public.ignore_recovered_lead(uuid, text)
to authenticated;


-- ============================================================
-- COMMENTS
-- ============================================================

comment on function public.handle_new_user() is
  'Creates the LeadNexus public profile after Supabase Auth user creation.';


comment on function public.is_platform_admin() is
  'Returns whether the currently authenticated user is a LeadNexus platform administrator.';


comment on function public.is_business_member(uuid) is
  'Returns whether the current authenticated user belongs to the supplied LeadNexus business.';


comment on function public.is_business_owner(uuid) is
  'Returns whether the current authenticated user is the OWNER of the supplied LeadNexus business.';


comment on function public.can_manage_business(uuid) is
  'Returns whether the current authenticated user is an OWNER or MANAGER of the supplied LeadNexus business.';


comment on function public.handle_new_business() is
  'Creates default LeadNexus business settings and owner membership after business creation.';


comment on function public.prepare_new_lead() is
  'Normalizes phone and copies attribution from the visitor session before a LeadNexus lead is inserted.';


comment on function public.handle_new_lead() is
  'Attaches visitor session/activity to a new lead and initializes Lead Intelligence.';


comment on function public.handle_activity_event() is
  'Maintains visitor-session activity and marks direct-contact intent from contact CTA clicks.';


comment on function public.send_recovered_lead_to_owner(uuid, text) is
  'Platform-admin-only atomic workflow that exposes an approved recovered lead to its business owner.';


comment on function public.ignore_recovered_lead(uuid, text) is
  'Platform-admin-only workflow for rejecting a recovered-lead candidate.';