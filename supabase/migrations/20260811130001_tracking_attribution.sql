alter table public.tracking_links
  add column if not exists name text,
  add column if not exists code text,
  add column if not exists source text,
  add column if not exists medium text,
  add column if not exists campaign text,
  add column if not exists content text,
  add column if not exists term text,
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists destination_path text,
  add column if not exists active boolean not null default true,
  add column if not exists click_count bigint not null default 0,
  add column if not exists last_clicked_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists tracking_links_business_id_idx
  on public.tracking_links(business_id);

create index if not exists tracking_links_code_idx
  on public.tracking_links(code);

create index if not exists tracking_links_product_id_idx
  on public.tracking_links(product_id);

alter table public.visitor_sessions
  add column if not exists first_tracking_link_id uuid
    references public.tracking_links(id) on delete set null,
  add column if not exists last_tracking_link_id uuid
    references public.tracking_links(id) on delete set null,

  add column if not exists first_medium text,
  add column if not exists first_campaign text,
  add column if not exists first_content text,
  add column if not exists first_term text,
  add column if not exists first_referrer text,

  add column if not exists last_source text,
  add column if not exists last_medium text,
  add column if not exists last_campaign text,
  add column if not exists last_content text,
  add column if not exists last_term text,
  add column if not exists last_referrer text,
  add column if not exists last_landing_path text,

  add column if not exists visit_count integer not null default 1,
  add column if not exists last_seen_at timestamptz not null default now();

create index if not exists visitor_sessions_first_tracking_link_idx
  on public.visitor_sessions(first_tracking_link_id);

create index if not exists visitor_sessions_last_tracking_link_idx
  on public.visitor_sessions(last_tracking_link_id);