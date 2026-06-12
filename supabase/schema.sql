-- Gecombineerd schema voor UXSTARS (fase 2).
-- Gegenereerd uit supabase/migrations/. Plak dit in de Supabase SQL-editor
-- (Database → SQL Editor) als je de CLI niet gebruikt. Idempotent voor schema
-- via 'if not exists' is niet overal toegepast: draai op een schone database.

-- ====================================================================
-- 20250612120000_prelude.sql
-- ====================================================================
-- Prelude: extensies en gedeelde helpers.

-- gen_random_uuid() (standaard aanwezig op Supabase, maar expliciet voor lokaal)
create extension if not exists pgcrypto;

-- Houdt updated_at bij op tabellen die wijzigen.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ====================================================================
-- 20250612120001_opdrachtgevers.sql
-- ====================================================================
-- Opdrachtgevers: organisaties die missies plaatsen. Privé (geen publieke RLS).
create table public.opdrachtgevers (
  id             uuid primary key default gen_random_uuid(),
  naam           text not null,                 -- organisatie / bedrijf
  contactpersoon text,
  email          text not null,
  telefoon       text,
  created_at     timestamptz not null default now()
);

comment on table public.opdrachtgevers is 'Organisaties die missies plaatsen. Niet publiek leesbaar.';

-- ====================================================================
-- 20250612120002_stars.sql
-- ====================================================================
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

-- ====================================================================
-- 20250612120003_missies.sql
-- ====================================================================
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

-- ====================================================================
-- 20250612120004_reacties.sql
-- ====================================================================
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

-- ====================================================================
-- 20250612120005_vouches.sql
-- ====================================================================
-- Vouches: een star staat in voor een andere star. De paren vormen de lijnen
-- in het sterrenveld; de id-paren zijn publiek leesbaar (toelichting niet).
create table public.vouches (
  id           uuid primary key default gen_random_uuid(),
  van_star_id  uuid not null references public.stars (id) on delete cascade,
  naar_star_id uuid not null references public.stars (id) on delete cascade,
  toelichting  text,
  created_at   timestamptz not null default now(),
  unique (van_star_id, naar_star_id),
  check (van_star_id <> naar_star_id)
);

create index vouches_van_idx on public.vouches (van_star_id);
create index vouches_naar_idx on public.vouches (naar_star_id);

comment on table public.vouches is 'Vouch-verbindingen tussen stars. Id-paren publiek (lijnen), toelichting privé.';

-- ====================================================================
-- 20250612120006_plaatsingen.sql
-- ====================================================================
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

-- ====================================================================
-- 20250612120007_rls.sql
-- ====================================================================
-- Row Level Security op alle tabellen.
--
-- Uitgangspunt: het publiek (rollen anon + authenticated) leest alleen:
--   • missies met status 'open'  (volledig)
--   • stars met status 'actief'  (zonder e-mail en tarief — kolomrechten)
--   • vouches                    (alleen de id-paren voor de lijnen)
-- Alle overige tabellen krijgen RLS aan zonder publieke policy, dus geen
-- publieke toegang. De service_role (seed/admin) omzeilt RLS automatisch.

-- ── RLS aanzetten ──────────────────────────────────────────────────────────
alter table public.opdrachtgevers enable row level security;
alter table public.stars          enable row level security;
alter table public.missies        enable row level security;
alter table public.reacties       enable row level security;
alter table public.vouches        enable row level security;
alter table public.plaatsingen    enable row level security;

-- ── Missies: publiek leest open missies (alle kolommen) ─────────────────────
create policy "publiek leest open missies"
  on public.missies for select
  to anon, authenticated
  using (status = 'open');

-- ── Stars: publiek leest actieve stars, maar niet e-mail/tarief ─────────────
-- Rijfilter via policy, kolomfilter via grants (RLS is niet kolomgewijs).
create policy "publiek leest actieve stars"
  on public.stars for select
  to anon, authenticated
  using (status = 'actief');

revoke select on public.stars from anon, authenticated;
grant select
  (id, naam, specialisme, seniority, bio, beschikbaar, status, created_at, updated_at)
  on public.stars to anon, authenticated;

-- ── Vouches: publiek leest de verbindingen (id-paren), niet de toelichting ──
create policy "publiek leest vouches"
  on public.vouches for select
  to anon, authenticated
  using (true);

revoke select on public.vouches from anon, authenticated;
grant select
  (id, van_star_id, naar_star_id, created_at)
  on public.vouches to anon, authenticated;

-- opdrachtgevers, reacties en plaatsingen krijgen bewust géén publieke policy:
-- met RLS aan en geen policy is er geen anon/authenticated toegang.

