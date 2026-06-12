-- Stars: de designers in het stelsel. Publiek leesbaar wanneer status = 'actief',
-- maar zonder tarief en e-mail (afgedwongen met kolomrechten in de RLS-migratie).
create table public.stars (
  id          uuid primary key default gen_random_uuid(),
  naam        text not null,
  specialisme text not null,
  seniority   text not null,
  bio         text,
  beschikbaar boolean not null default false,    -- bepaalt de gloed in het sterrenveld
  email       text,                              -- PRIVÉ: nooit publiek
  tarief_uur  numeric(8, 2),                     -- PRIVÉ: nooit publiek
  status      text not null default 'aangevraagd'
              check (status in ('aangevraagd', 'gevouched', 'actief', 'gepauzeerd')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index stars_status_idx on public.stars (status);

create trigger stars_updated_at
  before update on public.stars
  for each row execute function public.set_updated_at();

comment on table public.stars is 'Designers in het stelsel. Publiek alleen status=actief, zonder email/tarief.';
