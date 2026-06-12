-- Missies: opdrachten. Publiek leesbaar wanneer status = 'open'.
create table public.missies (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  titel            text not null,
  rol              text not null,
  locatie          text,
  uren_per_week    text,
  duur             text,
  tarief_indicatie text,
  seniority        text,
  start_indicatie  text,
  status           text not null default 'concept'
                   check (status in ('concept', 'in_review', 'open', 'gevuld', 'gearchiveerd')),
  intro            text,
  omschrijving     text[] not null default '{}',   -- alinea's
  opdrachtgever_id uuid references public.opdrachtgevers (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index missies_status_idx on public.missies (status);

create trigger missies_updated_at
  before update on public.missies
  for each row execute function public.set_updated_at();

comment on table public.missies is 'Opdrachten. Publiek alleen status=open.';
