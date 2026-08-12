-- ============================================================
-- LeadNexus
-- Phase 10: Rules-based Lead Intelligence
-- ============================================================

-- ------------------------------------------------------------
-- 1. Make sure the intelligence table has the canonical fields
-- ------------------------------------------------------------

alter table public.lead_intelligence
  add column if not exists business_id uuid
    references public.businesses(id) on delete cascade,

  add column if not exists lead_id uuid
    references public.leads(id) on delete cascade,

  add column if not exists temperature public.lead_temperature
    not null default 'UNKNOWN',

  add column if not exists score integer
    not null default 0,

  add column if not exists primary_interest text,

  add column if not exists buying_intent text,

  add column if not exists reasons jsonb
    not null default '[]'::jsonb,

  add column if not exists recommended_action text,

  add column if not exists analysis_method public.lead_analysis_method
    not null default 'RULES',

  add column if not exists analyzed_at timestamptz,

  add column if not exists updated_at timestamptz
    not null default now();


create index if not exists lead_intelligence_business_id_idx
  on public.lead_intelligence(business_id);


create index if not exists lead_intelligence_lead_id_idx
  on public.lead_intelligence(lead_id);


create index if not exists lead_intelligence_temperature_idx
  on public.lead_intelligence(temperature);


create index if not exists lead_intelligence_score_idx
  on public.lead_intelligence(score desc);


-- ------------------------------------------------------------
-- 2. Main deterministic intelligence engine
-- ------------------------------------------------------------

create or replace function public.analyze_lead_rules(
  p_lead_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.leads%rowtype;

  v_score integer := 0;

  v_page_views integer := 0;
  v_product_views integer := 0;
  v_distinct_products integer := 0;

  v_form_submitted boolean := false;
  v_product_engaged boolean := false;
  v_return_visit boolean := false;
  v_cta_clicked boolean := false;
  v_direct_contact boolean := false;

  v_temperature public.lead_temperature := 'COLD';

  v_buying_intent text := 'LOW';

  v_primary_interest text;

  v_reasons jsonb := '[]'::jsonb;

  v_recommended_action text;

  v_intelligence_id uuid;
begin

  -- ----------------------------------------------------------
  -- Load lead
  -- ----------------------------------------------------------

  select *
  into v_lead
  from public.leads
  where id = p_lead_id;

  if not found then
    return null;
  end if;


  -- ----------------------------------------------------------
  -- Behaviour statistics
  -- ----------------------------------------------------------

  select

    (
      count(*)
      filter (
        where event_type = 'PAGE_VIEW'
      )
    )::integer,

    (
      count(*)
      filter (
        where event_type = 'PRODUCT_VIEW'
      )
    )::integer,

    (
      count(distinct product_id)
      filter (
        where product_id is not null
      )
    )::integer,

    (
      count(*)
      filter (
        where event_type = 'LEAD_FORM_SUBMITTED'
      ) > 0
    ),

    (
      count(*)
      filter (
        where event_type = 'PRODUCT_ENGAGED'
      ) > 0
    ),

    (
      count(*)
      filter (
        where event_type = 'RETURN_VISIT'
      ) > 0
    ),

    (
      count(*)
      filter (
        where event_type = 'CTA_CLICK'
      ) > 0
    ),

    (
      count(*)
      filter (
        where event_type in (
          'WHATSAPP_CLICK',
          'PHONE_CLICK',
          'EMAIL_CLICK',
          'INSTAGRAM_CLICK',
          'FACEBOOK_CLICK',
          'LINKEDIN_CLICK',
          'WEBSITE_CLICK'
        )
      ) > 0
    )

  into
    v_page_views,
    v_product_views,
    v_distinct_products,
    v_form_submitted,
    v_product_engaged,
    v_return_visit,
    v_cta_clicked,
    v_direct_contact

  from public.activity_events

  where lead_id = p_lead_id
    and business_id = v_lead.business_id;


  -- ----------------------------------------------------------
  -- Determine primary product/service interest
  -- ----------------------------------------------------------

  if v_lead.primary_product_id is not null then

    select name
    into v_primary_interest

    from public.products

    where id = v_lead.primary_product_id
      and business_id = v_lead.business_id;

  end if;


  -- If lead did not explicitly choose a primary product,
  -- use the most frequently engaged product.

  if v_primary_interest is null then

    select p.name
    into v_primary_interest

    from public.activity_events ae

    join public.products p
      on p.id = ae.product_id

    where ae.lead_id = p_lead_id
      and ae.business_id = v_lead.business_id
      and ae.product_id is not null

    group by
      p.id,
      p.name

    order by
      count(*) desc,
      max(ae.created_at) desc

    limit 1;

  end if;


  -- ----------------------------------------------------------
  -- 3. Scoring
  -- ----------------------------------------------------------

  -- Page engagement:
  -- up to 12 points.

  if v_page_views > 0 then

    v_score :=
      v_score +
      least(
        v_page_views * 3,
        12
      );

    if v_page_views >= 3 then

      v_reasons :=
        v_reasons ||
        jsonb_build_array(
          'Viewed the business page multiple times.'
        );

    end if;

  end if;


  -- Lead form submitted.

  if v_form_submitted then

    v_score :=
      v_score + 20;

    v_reasons :=
      v_reasons ||
      jsonb_build_array(
        'Submitted contact details.'
      );

  end if;


  -- Viewed products/services.

  if v_product_views > 0 then

    v_score :=
      v_score + 8;

    v_reasons :=
      v_reasons ||
      jsonb_build_array(
        'Viewed product or service information.'
      );

  end if;


  -- Stronger product engagement.

  if v_product_engaged then

    v_score :=
      v_score + 15;

    v_reasons :=
      v_reasons ||
      jsonb_build_array(
        'Showed explicit interest in a product or service.'
      );

  end if;


  -- Interested in several products.

  if v_distinct_products >= 2 then

    v_score :=
      v_score + 5;

    v_reasons :=
      v_reasons ||
      jsonb_build_array(
        'Explored multiple products or services.'
      );

  end if;


  -- Returned visitor.

  if v_return_visit then

    v_score :=
      v_score + 15;

    v_reasons :=
      v_reasons ||
      jsonb_build_array(
        'Returned to the business page.'
      );

  end if;


  -- Generic CTA engagement.

  if v_cta_clicked then

    v_score :=
      v_score + 8;

    v_reasons :=
      v_reasons ||
      jsonb_build_array(
        'Clicked a call-to-action.'
      );

  end if;


  -- Direct external contact action.

  if v_direct_contact then

    v_score :=
      v_score + 25;

    v_reasons :=
      v_reasons ||
      jsonb_build_array(
        'Used a direct business contact option.'
      );

  end if;


  -- Database-confirmed direct-contact intent.

  if v_lead.contact_intent = 'DIRECT_CONTACT' then

    v_score :=
      v_score + 10;

    v_reasons :=
      v_reasons ||
      jsonb_build_array(
        'Lead has direct contact intent.'
      );

  end if;


  -- ----------------------------------------------------------
  -- Never exceed 100
  -- ----------------------------------------------------------

  v_score :=
    least(
      v_score,
      100
    );


  -- ----------------------------------------------------------
  -- 4. Temperature + buying intent
  -- ----------------------------------------------------------

  if v_score >= 70 then

    v_temperature :=
      'HOT';

    v_buying_intent :=
      'HIGH';

  elsif v_score >= 40 then

    v_temperature :=
      'WARM';

    v_buying_intent :=
      'MEDIUM';

  else

    v_temperature :=
      'COLD';

    v_buying_intent :=
      'LOW';

  end if;


  -- ----------------------------------------------------------
  -- 5. Recommended next action
  -- ----------------------------------------------------------

  if
    v_temperature = 'HOT'
    and
    v_lead.contact_intent = 'DIRECT_CONTACT'
  then

    v_recommended_action :=
      case

        when v_primary_interest is not null then

          'Prioritize follow-up and reference the lead''s interest in '
          || v_primary_interest
          || '.'

        else

          'Prioritize follow-up while the lead shows strong buying intent.'

      end;


  elsif
    v_temperature = 'HOT'
    and
    v_lead.visibility = 'ADMIN_ONLY'
  then

    v_recommended_action :=
      'Review this high-intent abandoned lead for recovery before revealing it to the business owner.';


  elsif v_temperature = 'HOT' then

    v_recommended_action :=
      'Prioritize this lead for immediate follow-up.';


  elsif v_temperature = 'WARM' then

    v_recommended_action :=
      case

        when v_primary_interest is not null then

          'Follow up with focused information about '
          || v_primary_interest
          || '.'

        else

          'Follow up with relevant business or product information.'

      end;


  else

    v_recommended_action :=
      'Keep this lead in the pipeline and monitor for stronger engagement.';

  end if;


  -- ----------------------------------------------------------
  -- 6. Update existing intelligence row
  -- ----------------------------------------------------------

  v_intelligence_id :=
    null;


  update public.lead_intelligence

  set
    business_id =
      v_lead.business_id,

    temperature =
      v_temperature,

    score =
      v_score,

    primary_interest =
      v_primary_interest,

    buying_intent =
      v_buying_intent,

    reasons =
      v_reasons,

    recommended_action =
      v_recommended_action,

    analysis_method =
      'RULES',

    analyzed_at =
      now(),

    updated_at =
      now()

  where lead_id =
    p_lead_id

  returning id
  into v_intelligence_id;


  -- ----------------------------------------------------------
  -- 7. Insert if intelligence does not exist yet
  -- ----------------------------------------------------------

  if v_intelligence_id is null then

    insert into public.lead_intelligence (
      business_id,
      lead_id,
      temperature,
      score,
      primary_interest,
      buying_intent,
      reasons,
      recommended_action,
      analysis_method,
      analyzed_at,
      updated_at
    )

    values (
      v_lead.business_id,
      p_lead_id,
      v_temperature,
      v_score,
      v_primary_interest,
      v_buying_intent,
      v_reasons,
      v_recommended_action,
      'RULES',
      now(),
      now()
    )

    returning id
    into v_intelligence_id;

  end if;


  return v_intelligence_id;

end;
$$;


-- ------------------------------------------------------------
-- Security
-- ------------------------------------------------------------

revoke all
on function public.analyze_lead_rules(uuid)
from public;


revoke all
on function public.analyze_lead_rules(uuid)
from anon;


revoke all
on function public.analyze_lead_rules(uuid)
from authenticated;


grant execute
on function public.analyze_lead_rules(uuid)
to service_role;


-- ------------------------------------------------------------
-- 8. Recalculate intelligence when an activity event is added
-- ------------------------------------------------------------

create or replace function public.handle_lead_intelligence_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if new.lead_id is not null then

    perform public.analyze_lead_rules(
      new.lead_id
    );

  end if;

  return new;

end;
$$;


drop trigger if exists
  trg_lead_intelligence_activity
on public.activity_events;


create trigger trg_lead_intelligence_activity

after insert
on public.activity_events

for each row

execute function
  public.handle_lead_intelligence_activity();


-- ------------------------------------------------------------
-- 9. Recalculate when important lead properties change
-- ------------------------------------------------------------

create or replace function public.handle_lead_intelligence_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  perform public.analyze_lead_rules(
    new.id
  );

  return new;

end;
$$;


drop trigger if exists
  trg_lead_intelligence_lead
on public.leads;


create trigger trg_lead_intelligence_lead

after insert
or update of
  contact_intent,
  primary_product_id,
  visibility

on public.leads

for each row

execute function
  public.handle_lead_intelligence_lead();


-- ------------------------------------------------------------
-- 10. Backfill every existing lead
-- ------------------------------------------------------------

do $$
declare
  lead_record record;
begin

  for lead_record
  in
    select id
    from public.leads
  loop

    perform public.analyze_lead_rules(
      lead_record.id
    );

  end loop;

end;
$$;