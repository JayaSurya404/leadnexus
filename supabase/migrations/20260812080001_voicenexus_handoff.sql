-- ============================================================
-- LeadNexus
-- Phase 13: VoiceNexus handoff / outbox
-- ============================================================

alter table public.integration_connections
  add column if not exists business_id uuid
    references public.businesses(id)
    on delete cascade,

  add column if not exists provider public.integration_provider,

  add column if not exists status public.integration_status
    not null default 'DISCONNECTED',

  add column if not exists display_name text,

  add column if not exists last_error text,

  add column if not exists connected_at timestamptz,

  add column if not exists updated_at timestamptz
    not null default now();


create index if not exists
  integration_connections_business_idx
on public.integration_connections(business_id);


create index if not exists
  integration_connections_provider_idx
on public.integration_connections(provider);


alter table public.outbox_events
  add column if not exists business_id uuid
    references public.businesses(id)
    on delete cascade,

  add column if not exists provider public.integration_provider,

  add column if not exists event_type text,

  add column if not exists aggregate_type text,

  add column if not exists aggregate_id uuid,

  add column if not exists payload jsonb
    not null default '{}'::jsonb,

  add column if not exists status public.outbox_status
    not null default 'PENDING',

  add column if not exists attempt_count integer
    not null default 0,

  add column if not exists last_error text,

  add column if not exists available_at timestamptz
    not null default now(),

  add column if not exists sent_at timestamptz,

  add column if not exists created_at timestamptz
    not null default now(),

  add column if not exists updated_at timestamptz
    not null default now();


create index if not exists
  outbox_events_business_idx
on public.outbox_events(business_id);


create index if not exists
  outbox_events_provider_status_idx
on public.outbox_events(provider, status);


create index if not exists
  outbox_events_aggregate_idx
on public.outbox_events(aggregate_type, aggregate_id);