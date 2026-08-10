-- ============================================================
-- LeadNexus
-- Migration: 005_storage.sql
--
-- Purpose:
--   Supabase Storage configuration for LeadNexus.
--
-- Buckets:
--
--   1. business-media
--      Public business-facing assets:
--        - logo
--        - cover
--        - product/service images
--
--   2. profile-avatars
--      Public profile avatar images.
--
--
-- BUSINESS MEDIA PATH FORMAT
--
--   <business_id>/logo/<filename>
--   <business_id>/cover/<filename>
--   <business_id>/products/<filename>
--
-- Example:
--
--   8c2.../logo/logo.webp
--   8c2.../cover/hero.webp
--   8c2.../products/solar-panel.webp
--
--
-- PROFILE AVATAR PATH FORMAT
--
--   <user_id>/<filename>
--
-- Example:
--
--   8c2.../avatar.webp
--
--
-- SECURITY:
--
--   PLATFORM ADMIN
--      Can manage all LeadNexus files.
--
--   BUSINESS OWNER / MANAGER
--      Can manage only files under businesses they belong to.
--
--   AUTHENTICATED USER
--      Can manage only their own profile-avatar folder.
--
--   PUBLIC VISITOR
--      Can VIEW public bucket assets through public URLs.
--      Cannot upload/update/delete files.
--
-- ============================================================


-- ============================================================
-- CREATE / CONFIGURE STORAGE BUCKETS
-- ============================================================


-- ------------------------------------------------------------
-- BUSINESS MEDIA
--
-- 8 MB per object.
--
-- SVG uploads are intentionally not allowed for this MVP.
-- ------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'business-media',
  'business-media',
  true,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
  ]
)
on conflict (id)
do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ------------------------------------------------------------
-- PROFILE AVATARS
--
-- 3 MB per object.
-- ------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  3145728,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
  ]
)
on conflict (id)
do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- HELPER
--
-- VALID BUSINESS MEDIA PATH
--
-- Expected:
--
--   business_uuid/logo/file.ext
--   business_uuid/cover/file.ext
--   business_uuid/products/file.ext
--
-- ============================================================

create or replace function public.is_valid_business_media_path(
  object_name text
)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select
    array_length(
      storage.foldername(object_name),
      1
    ) >= 2

    and

    (storage.foldername(object_name))[1] is not null

    and

    (storage.foldername(object_name))[2] in (
      'logo',
      'cover',
      'products'
    )

    and

    lower(
      coalesce(
        storage.extension(object_name),
        ''
      )
    ) in (
      'jpg',
      'jpeg',
      'png',
      'webp',
      'avif'
    );
$$;


-- ============================================================
-- HELPER
--
-- CAN MANAGE BUSINESS MEDIA PATH
--
-- Avoids blindly casting arbitrary object paths to UUID.
--
-- Membership comparison is performed using UUID -> text.
-- ============================================================

create or replace function public.can_manage_business_media_path(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select

    public.is_platform_admin()

    or

    exists (
      select 1
      from public.business_members as member
      where
        member.user_id = (
          select auth.uid()
        )

        and

        member.role in (
          'OWNER',
          'MANAGER'
        )

        and

        member.business_id::text =
          (storage.foldername(object_name))[1]
    );
$$;


-- ============================================================
-- HELPER
--
-- CAN VIEW BUSINESS MEDIA THROUGH AUTHENTICATED STORAGE API
--
-- Used when owners list their uploaded files.
-- ============================================================

create or replace function public.can_access_business_media_path(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select

    public.is_platform_admin()

    or

    exists (
      select 1
      from public.business_members as member
      where
        member.user_id = (
          select auth.uid()
        )

        and

        member.business_id::text =
          (storage.foldername(object_name))[1]
    );
$$;


-- ============================================================
-- HELPER
--
-- VALID PROFILE AVATAR PATH
--
-- Expected:
--
--   user_uuid/file.ext
--
-- ============================================================

create or replace function public.is_valid_profile_avatar_path(
  object_name text
)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select
    array_length(
      storage.foldername(object_name),
      1
    ) = 1

    and

    (storage.foldername(object_name))[1] is not null

    and

    lower(
      coalesce(
        storage.extension(object_name),
        ''
      )
    ) in (
      'jpg',
      'jpeg',
      'png',
      'webp',
      'avif'
    );
$$;


-- ============================================================
-- HELPER
--
-- USER OWNS PROFILE AVATAR PATH
-- ============================================================

create or replace function public.can_manage_profile_avatar_path(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select

    public.is_platform_admin()

    or

    (
      (
        storage.foldername(object_name)
      )[1]
      =
      (
        select auth.uid()
      )::text
    );
$$;


-- ============================================================
-- FUNCTION PRIVILEGES
-- ============================================================

revoke execute
on function public.is_valid_business_media_path(text)
from public, anon;


grant execute
on function public.is_valid_business_media_path(text)
to authenticated;


revoke execute
on function public.can_manage_business_media_path(text)
from public, anon;


grant execute
on function public.can_manage_business_media_path(text)
to authenticated;


revoke execute
on function public.can_access_business_media_path(text)
from public, anon;


grant execute
on function public.can_access_business_media_path(text)
to authenticated;


revoke execute
on function public.is_valid_profile_avatar_path(text)
from public, anon;


grant execute
on function public.is_valid_profile_avatar_path(text)
to authenticated;


revoke execute
on function public.can_manage_profile_avatar_path(text)
from public, anon;


grant execute
on function public.can_manage_profile_avatar_path(text)
to authenticated;


-- ============================================================
-- REMOVE OLD POLICIES IF MIGRATION IS REPLAYED
-- ============================================================


-- BUSINESS MEDIA

drop policy if exists
  "leadnexus_business_media_select"
on storage.objects;


drop policy if exists
  "leadnexus_business_media_insert"
on storage.objects;


drop policy if exists
  "leadnexus_business_media_update"
on storage.objects;


drop policy if exists
  "leadnexus_business_media_delete"
on storage.objects;


-- PROFILE AVATARS

drop policy if exists
  "leadnexus_profile_avatars_select"
on storage.objects;


drop policy if exists
  "leadnexus_profile_avatars_insert"
on storage.objects;


drop policy if exists
  "leadnexus_profile_avatars_update"
on storage.objects;


drop policy if exists
  "leadnexus_profile_avatars_delete"
on storage.objects;


-- ============================================================
-- BUSINESS MEDIA
-- SELECT
--
-- Public URLs are already public because the bucket itself is
-- public.
--
-- This SELECT policy is mainly for authenticated Storage API
-- operations such as listing/reading metadata for the files
-- belonging to the user's business.
-- ============================================================

create policy "leadnexus_business_media_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'business-media'

  and

  public.is_valid_business_media_path(
    name
  )

  and

  public.can_access_business_media_path(
    name
  )
);


-- ============================================================
-- BUSINESS MEDIA
-- INSERT
--
-- OWNER/MANAGER can upload only to:
--
--   their_business_id/logo/
--   their_business_id/cover/
--   their_business_id/products/
--
-- ============================================================

create policy "leadnexus_business_media_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'business-media'

  and

  public.is_valid_business_media_path(
    name
  )

  and

  public.can_manage_business_media_path(
    name
  )
);


-- ============================================================
-- BUSINESS MEDIA
-- UPDATE
--
-- Both USING and WITH CHECK are intentional.
--
-- USING:
--   user must control the existing object.
--
-- WITH CHECK:
--   renamed/moved destination must remain inside a business
--   path the same user is allowed to manage.
-- ============================================================

create policy "leadnexus_business_media_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'business-media'

  and

  public.can_manage_business_media_path(
    name
  )
)
with check (
  bucket_id = 'business-media'

  and

  public.is_valid_business_media_path(
    name
  )

  and

  public.can_manage_business_media_path(
    name
  )
);


-- ============================================================
-- BUSINESS MEDIA
-- DELETE
-- ============================================================

create policy "leadnexus_business_media_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'business-media'

  and

  public.can_manage_business_media_path(
    name
  )
);


-- ============================================================
-- PROFILE AVATARS
-- SELECT
--
-- Bucket is public for final asset delivery.
--
-- Authenticated users may access metadata/list only inside
-- their own user folder.
--
-- Platform admin can access all.
-- ============================================================

create policy "leadnexus_profile_avatars_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'

  and

  public.is_valid_profile_avatar_path(
    name
  )

  and

  public.can_manage_profile_avatar_path(
    name
  )
);


-- ============================================================
-- PROFILE AVATARS
-- INSERT
-- ============================================================

create policy "leadnexus_profile_avatars_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'

  and

  public.is_valid_profile_avatar_path(
    name
  )

  and

  public.can_manage_profile_avatar_path(
    name
  )
);


-- ============================================================
-- PROFILE AVATARS
-- UPDATE
-- ============================================================

create policy "leadnexus_profile_avatars_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'

  and

  public.can_manage_profile_avatar_path(
    name
  )
)
with check (
  bucket_id = 'profile-avatars'

  and

  public.is_valid_profile_avatar_path(
    name
  )

  and

  public.can_manage_profile_avatar_path(
    name
  )
);


-- ============================================================
-- PROFILE AVATARS
-- DELETE
-- ============================================================

create policy "leadnexus_profile_avatars_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'

  and

  public.can_manage_profile_avatar_path(
    name
  )
);


-- ============================================================
-- STORAGE COMMENTS
-- ============================================================

comment on function public.is_valid_business_media_path(text) is
  'Validates LeadNexus business-media paths and supported image extensions.';


comment on function public.can_manage_business_media_path(text) is
  'Checks whether the authenticated user can upload/update/delete files for the business encoded in a business-media object path.';


comment on function public.can_access_business_media_path(text) is
  'Checks whether the authenticated user belongs to the business encoded in a business-media object path.';


comment on function public.is_valid_profile_avatar_path(text) is
  'Validates LeadNexus profile-avatar object paths and supported image extensions.';


comment on function public.can_manage_profile_avatar_path(text) is
  'Checks whether an authenticated user owns the profile-avatar folder or is platform admin.';


-- ============================================================
-- EXPECTED APPLICATION STORAGE PATHS
--
-- BUSINESS LOGO
--
--   bucket:
--     business-media
--
--   path:
--     <business_id>/logo/<unique_filename>.webp
--
--
-- BUSINESS COVER
--
--   bucket:
--     business-media
--
--   path:
--     <business_id>/cover/<unique_filename>.webp
--
--
-- PRODUCT IMAGE
--
--   bucket:
--     business-media
--
--   path:
--     <business_id>/products/<product_id>-<unique>.webp
--
--
-- USER AVATAR
--
--   bucket:
--     profile-avatars
--
--   path:
--     <user_id>/<unique_filename>.webp
--
--
-- IMPORTANT
--
-- Database values such as:
--
--   businesses.logo_url
--   businesses.cover_url
--   products.image_url
--   profiles.avatar_url
--
-- will store the resulting public asset URL.
--
-- ============================================================