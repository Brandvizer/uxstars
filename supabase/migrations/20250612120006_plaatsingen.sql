-- Plaatsingen: een star is op een missie geplaatst. Privé (geen publieke RLS).
create table public.plaatsingen (
  id         uuid primary key default gen_random_uuid(),
  missie_id  uuid not null references public.missies (id) on delete cascade,
  star_id    uuid not null references public.stars (id) on delete cascade,
  startdatum date,
  einddatum  date,
  tarief_uur numeric(8, 2),
  status     text not null default 'actief'
             check (status in ('actief', 'afgerond', 'geannuleerd')),
  created_at timestamptz not null default now()
);

create index plaatsingen_missie_idx on public.plaatsingen (missie_id);
create index plaatsingen_star_idx on public.plaatsingen (star_id);

comment on table public.plaatsingen is 'Geplaatste stars op missies. Niet publiek leesbaar.';
