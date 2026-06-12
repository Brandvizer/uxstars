-- Reacties: een star reageert op een missie. Privé (geen publieke RLS).
create table public.reacties (
  id         uuid primary key default gen_random_uuid(),
  missie_id  uuid not null references public.missies (id) on delete cascade,
  star_id    uuid references public.stars (id) on delete set null,
  motivatie  text,
  status     text not null default 'nieuw'
             check (status in ('nieuw', 'bekeken', 'uitgenodigd', 'afgewezen')),
  created_at timestamptz not null default now()
);

create index reacties_missie_idx on public.reacties (missie_id);

comment on table public.reacties is 'Reacties van stars op missies. Niet publiek leesbaar.';
