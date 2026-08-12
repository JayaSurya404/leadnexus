-- ============================================================
-- LeadNexus
-- Phase 12: Canonical SEO fields
-- ============================================================

alter table public.seo_settings
  add column if not exists business_id uuid
    references public.businesses(id)
    on delete cascade,

  add column if not exists title text,

  add column if not exists description text,

  add column if not exists keywords text[]
    not null default '{}',

  add column if not exists canonical_url text,

  add column if not exists og_title text,

  add column if not exists og_description text,

  add column if not exists indexable boolean
    not null default true,

  add column if not exists updated_at timestamptz
    not null default now();


create index if not exists
  seo_settings_business_id_idx
on public.seo_settings(business_id);


create index if not exists
  seo_settings_indexable_idx
on public.seo_settings(indexable);