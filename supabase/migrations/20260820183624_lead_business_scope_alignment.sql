begin;

alter table public.lead_notes
  add column if not exists business_id uuid
  references public.businesses(id)
  on delete cascade;

alter table public.lead_intelligence
  add column if not exists business_id uuid
  references public.businesses(id)
  on delete cascade;

alter table public.lead_intelligence
  add column if not exists buying_intent text;

update public.lead_notes as note
set business_id = lead.business_id
from public.leads as lead
where note.lead_id = lead.id
  and note.business_id is distinct from lead.business_id;

update public.lead_intelligence as intelligence
set business_id = lead.business_id
from public.leads as lead
where intelligence.lead_id = lead.id
  and intelligence.business_id is distinct from lead.business_id;

alter table public.lead_notes
  alter column business_id set not null;

alter table public.lead_intelligence
  alter column business_id set not null;

create index if not exists lead_notes_business_created_idx
on public.lead_notes (business_id, created_at desc);

create index if not exists lead_intelligence_business_temperature_idx
on public.lead_intelligence (business_id, temperature, score desc);

create or replace function public.prepare_lead_child_business_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lead_business_id uuid;
begin
  select business_id
  into lead_business_id
  from public.leads
  where id = new.lead_id;

  if not found then
    raise exception 'Lead does not exist.';
  end if;

  if new.business_id is not null
    and new.business_id <> lead_business_id
  then
    raise exception 'Lead child business does not match lead business.';
  end if;

  new.business_id := lead_business_id;
  return new;
end;
$$;

revoke execute
on function public.prepare_lead_child_business_id()
from public, anon, authenticated;

drop trigger if exists lead_notes_set_business_id
on public.lead_notes;

create trigger lead_notes_set_business_id
before insert or update of lead_id, business_id
on public.lead_notes
for each row
execute function public.prepare_lead_child_business_id();

drop trigger if exists lead_intelligence_set_business_id
on public.lead_intelligence;

create trigger lead_intelligence_set_business_id
before insert or update of lead_id, business_id
on public.lead_intelligence
for each row
execute function public.prepare_lead_child_business_id();

comment on column public.lead_notes.business_id is
  'Tenant scope copied from the parent lead and enforced by trigger.';

comment on column public.lead_intelligence.business_id is
  'Tenant scope copied from the parent lead and enforced by trigger.';

comment on column public.lead_intelligence.buying_intent is
  'Concise evidence-based buying intent used by the admin recovery workflow.';

commit;
