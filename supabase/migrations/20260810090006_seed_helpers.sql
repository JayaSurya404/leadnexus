-- ============================================================
-- LeadNexus
-- Migration: 006_seed_helpers.sql
--
-- Purpose:
--   Production-safe bootstrap and maintenance helpers.
--
-- This migration DOES NOT create:
--
--   - fake users
--   - fake businesses
--   - fake products
--   - fake leads
--   - fake analytics
--   - fake Lead Intelligence
--
-- It provides only:
--
--   1. Safe profile backfill for existing Supabase Auth users.
--
--   2. Safe platform-admin promotion/demotion by email.
--
--   3. Database-owner-only bootstrap helpers.
--
--   4. Secure default function privileges for future
--      migrations.
--
-- IMPORTANT:
--
--   These administrative helpers are NOT executable by:
--
--     anon
--     authenticated
--
--   They are intended to be run manually by the database owner
--   from the Supabase SQL Editor when required.
--
-- ============================================================


-- ============================================================
-- DEFAULT FUNCTION SECURITY
--
-- PostgreSQL normally gives PUBLIC execute permission on newly
-- created functions.
--
-- LeadNexus uses least privilege instead.
--
-- Future application RPC functions must therefore explicitly
-- GRANT EXECUTE to the required role.
-- ============================================================

alter default privileges
in schema public
revoke execute
on functions
from public;


alter default privileges
in schema public
revoke execute
on functions
from anon, authenticated;


-- ============================================================
-- ENSURE ONE AUTH USER HAS A PROFILE
--
-- Useful when:
--
--   - the Auth user existed before our profile trigger
--   - a migration/import created auth users earlier
--   - profile repair is required
--
-- This reads Supabase auth.users and inserts the corresponding
-- public.profiles row only when missing.
--
-- It NEVER changes platform_role for an existing profile.
-- ============================================================

create or replace function public.ensure_profile_for_auth_user(
  target_user_id uuid
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  auth_record auth.users%rowtype;
  profile_record public.profiles%rowtype;

  resolved_name text;
  resolved_phone text;
begin

  -- ----------------------------------------------------------
  -- FIND AUTH USER
  -- ----------------------------------------------------------

  select *
  into auth_record
  from auth.users
  where id = target_user_id;


  if not found then

    raise exception
      'Supabase Auth user not found.';

  end if;


  -- ----------------------------------------------------------
  -- RESOLVE BASIC PROFILE VALUES
  -- ----------------------------------------------------------

  resolved_name :=
    nullif(
      trim(
        coalesce(
          auth_record.raw_user_meta_data ->> 'full_name',
          auth_record.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    );


  resolved_phone :=
    nullif(
      trim(
        coalesce(
          auth_record.phone,
          auth_record.raw_user_meta_data ->> 'phone',
          ''
        )
      ),
      ''
    );


  -- ----------------------------------------------------------
  -- INSERT ONLY IF MISSING
  --
  -- platform_role deliberately remains the table default USER.
  -- ----------------------------------------------------------

  insert into public.profiles (
    id,
    full_name,
    phone
  )
  values (
    auth_record.id,
    resolved_name,
    resolved_phone
  )

  on conflict (id)
  do nothing;


  -- ----------------------------------------------------------
  -- RETURN PROFILE
  -- ----------------------------------------------------------

  select *
  into profile_record
  from public.profiles
  where id = auth_record.id;


  return profile_record;

end;
$$;


-- ============================================================
-- BACKFILL ALL MISSING AUTH PROFILES
--
-- Intended primarily for:
--
--   - migration/bootstrap
--   - recovery
--   - existing auth users created before LeadNexus schema
--
-- Returns the number of profiles inserted.
--
-- Existing profile rows are NEVER overwritten.
-- Existing platform roles are NEVER changed.
-- ============================================================

create or replace function public.backfill_missing_profiles()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin

  insert into public.profiles (
    id,
    full_name,
    phone
  )

  select
    auth_user.id,

    nullif(
      trim(
        coalesce(
          auth_user.raw_user_meta_data ->> 'full_name',
          auth_user.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    ),

    nullif(
      trim(
        coalesce(
          auth_user.phone,
          auth_user.raw_user_meta_data ->> 'phone',
          ''
        )
      ),
      ''
    )

  from auth.users as auth_user

  where not exists (
    select 1
    from public.profiles as profile
    where profile.id = auth_user.id
  )

  on conflict (id)
  do nothing;


  get diagnostics inserted_count = row_count;


  return inserted_count;

end;
$$;


-- ============================================================
-- SET PLATFORM ADMIN BY EMAIL
--
-- DATABASE OWNER / SQL EDITOR BOOTSTRAP UTILITY
--
-- Example after your real account exists:
--
--   select public.set_platform_admin_by_email(
--     'your-email@example.com',
--     true
--   );
--
--
-- To remove platform-admin access:
--
--   select public.set_platform_admin_by_email(
--     'your-email@example.com',
--     false
--   );
--
--
-- SECURITY:
--
--   anon         -> NO EXECUTE
--   authenticated -> NO EXECUTE
--
-- A normal signed-in user therefore cannot call this RPC to
-- promote themselves.
-- ============================================================

create or replace function public.set_platform_admin_by_email(
  target_email text,
  make_admin boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  normalized_email text;
begin

  -- ----------------------------------------------------------
  -- VALIDATE EMAIL
  -- ----------------------------------------------------------

  normalized_email :=
    lower(
      trim(
        coalesce(
          target_email,
          ''
        )
      )
    );


  if normalized_email = '' then

    raise exception
      'Email address is required.';

  end if;


  -- ----------------------------------------------------------
  -- FIND AUTH USER
  -- ----------------------------------------------------------

  select auth_user.id
  into target_user_id
  from auth.users as auth_user

  where lower(auth_user.email) =
    normalized_email

  limit 1;


  if not found then

    raise exception
      'No Supabase Auth user exists with email "%".',
      normalized_email;

  end if;


  -- ----------------------------------------------------------
  -- ENSURE PROFILE EXISTS
  -- ----------------------------------------------------------

  perform public.ensure_profile_for_auth_user(
    target_user_id
  );


  -- ----------------------------------------------------------
  -- SET ROLE
  -- ----------------------------------------------------------

  update public.profiles

  set
    platform_role =
      case
        when make_admin
          then 'PLATFORM_ADMIN'::public.platform_role

        else
          'USER'::public.platform_role
      end,

    updated_at = now()

  where id = target_user_id;


  -- ----------------------------------------------------------
  -- AUDIT
  --
  -- This action happens outside an authenticated app session,
  -- so actor_user_id can remain null.
  --
  -- We never store sensitive credentials here.
  -- ----------------------------------------------------------

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    null,

    case
      when make_admin
        then 'PLATFORM_ADMIN_GRANTED'

      else
        'PLATFORM_ADMIN_REVOKED'
    end,

    'profile',

    target_user_id,

    jsonb_build_object(
      'target_user_id',
      target_user_id,

      'method',
      'DATABASE_OWNER_BOOTSTRAP'
    )
  );


  return target_user_id;

end;
$$;


-- ============================================================
-- PLATFORM ADMIN COUNT
--
-- Database-owner maintenance helper.
--
-- Useful before accidentally removing the final administrator.
--
-- ============================================================

create or replace function public.platform_admin_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$

  select count(*)
  from public.profiles
  where platform_role = 'PLATFORM_ADMIN';

$$;


-- ============================================================
-- DATABASE FOUNDATION HEALTH CHECK
--
-- Returns a small JSON object confirming that the major
-- LeadNexus schema pieces exist.
--
-- This is a DATABASE OWNER maintenance helper, not an
-- application API endpoint.
-- ============================================================

create or replace function public.leadnexus_database_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin

  result :=
    jsonb_build_object(

      'profiles_table',
      to_regclass(
        'public.profiles'
      ) is not null,

      'businesses_table',
      to_regclass(
        'public.businesses'
      ) is not null,

      'products_table',
      to_regclass(
        'public.products'
      ) is not null,

      'visitor_sessions_table',
      to_regclass(
        'public.visitor_sessions'
      ) is not null,

      'leads_table',
      to_regclass(
        'public.leads'
      ) is not null,

      'activity_events_table',
      to_regclass(
        'public.activity_events'
      ) is not null,

      'lead_intelligence_table',
      to_regclass(
        'public.lead_intelligence'
      ) is not null,

      'recovery_table',
      to_regclass(
        'public.lead_recovery_reviews'
      ) is not null,

      'tracking_links_table',
      to_regclass(
        'public.tracking_links'
      ) is not null,

      'seo_settings_table',
      to_regclass(
        'public.seo_settings'
      ) is not null,

      'audit_logs_table',
      to_regclass(
        'public.audit_logs'
      ) is not null,

      'outbox_events_table',
      to_regclass(
        'public.outbox_events'
      ) is not null,

      'platform_admin_count',
      (
        select count(*)
        from public.profiles
        where platform_role = 'PLATFORM_ADMIN'
      )
    );


  return result;

end;
$$;


-- ============================================================
-- FUNCTION PRIVILEGES
--
-- CRITICAL:
--
-- None of these administrative/bootstrap functions should be
-- executable from normal Supabase client sessions.
-- ============================================================


-- ------------------------------------------------------------
-- ENSURE PROFILE
-- ------------------------------------------------------------

revoke execute
on function public.ensure_profile_for_auth_user(uuid)
from public, anon, authenticated;


-- ------------------------------------------------------------
-- BACKFILL PROFILES
-- ------------------------------------------------------------

revoke execute
on function public.backfill_missing_profiles()
from public, anon, authenticated;


-- ------------------------------------------------------------
-- ADMIN PROMOTION
-- ------------------------------------------------------------

revoke execute
on function public.set_platform_admin_by_email(text, boolean)
from public, anon, authenticated;


-- ------------------------------------------------------------
-- ADMIN COUNT
-- ------------------------------------------------------------

revoke execute
on function public.platform_admin_count()
from public, anon, authenticated;


-- ------------------------------------------------------------
-- DATABASE HEALTH
-- ------------------------------------------------------------

revoke execute
on function public.leadnexus_database_health()
from public, anon, authenticated;


-- ============================================================
-- COMMENTS
-- ============================================================

comment on function public.ensure_profile_for_auth_user(uuid) is
  'Database-owner utility that creates a missing LeadNexus profile for an existing Supabase Auth user without changing platform privileges.';


comment on function public.backfill_missing_profiles() is
  'Database-owner migration/recovery utility that creates profiles for existing Supabase Auth users that do not yet have LeadNexus profiles.';


comment on function public.set_platform_admin_by_email(text, boolean) is
  'Database-owner-only LeadNexus bootstrap utility for granting or revoking PLATFORM_ADMIN on an existing Supabase Auth user.';


comment on function public.platform_admin_count() is
  'Database-owner maintenance helper that returns the number of LeadNexus platform administrators.';


comment on function public.leadnexus_database_health() is
  'Database-owner maintenance helper returning the presence of major LeadNexus database components.';


-- ============================================================
-- IMPORTANT ADMIN BOOTSTRAP FLOW
--
-- DO NOT put an admin email/password in migration files.
--
-- Correct flow after migrations:
--
--   1. Create your REAL LeadNexus account through Supabase
--      Auth / our signup flow.
--
--   2. Open Supabase Dashboard -> SQL Editor.
--
--   3. Run:
--
--        select public.set_platform_admin_by_email(
--          'YOUR_REAL_EMAIL',
--          true
--        );
--
--   4. Confirm:
--
--        select
--          id,
--          full_name,
--          platform_role
--        from public.profiles;
--
--
-- Your password is NEVER stored in these migrations.
--
-- ============================================================