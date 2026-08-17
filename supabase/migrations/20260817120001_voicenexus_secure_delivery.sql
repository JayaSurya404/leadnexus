alter type public.integration_status add value if not exists 'CONFIGURED';
alter type public.integration_status add value if not exists 'VERIFIED';

alter table public.leads
  add column if not exists do_not_call boolean not null default false;

alter table public.outbox_events
  add column if not exists last_attempt_at timestamptz,
  add column if not exists response_payload jsonb;

alter table public.outbox_events
  drop constraint if exists outbox_events_response_payload_object;

alter table public.outbox_events
  add constraint outbox_events_response_payload_object
  check (response_payload is null or jsonb_typeof(response_payload) = 'object');

create unique index if not exists outbox_events_active_voicenexus_lead_idx
on public.outbox_events(business_id, provider, event_type, aggregate_id)
where provider = 'VOICENEXUS'
  and event_type = 'LEAD_HANDOFF_REQUESTED'
  and status in ('PENDING','PROCESSING');

create index if not exists outbox_events_voicenexus_retry_idx
on public.outbox_events(provider, status, available_at)
where provider = 'VOICENEXUS' and status in ('PENDING','FAILED');
