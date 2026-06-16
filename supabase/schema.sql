-- Gecombineerd schema voor UXSTARS (fase 2). Plak op een schone database.

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

-- ====================================================================
-- 20250612120008_missies_publiek.sql
-- ====================================================================
-- Missies publiek presenteerbaar maken (append-only; eerdere migraties niet wijzigen).
--
-- 1) Publiek label op de missie zelf, zodat de detailpagina een opdrachtgever
--    kan tonen ("Energieleverancier (top 3 NL)") zonder de privé tabel
--    opdrachtgevers te hoeven lezen. De échte klant + contact blijft privé.
alter table public.missies
  add column if not exists opdrachtgever_label text;

comment on column public.missies.opdrachtgever_label is
  'Publiek tonbare omschrijving van de opdrachtgever. De echte klant staat privé in opdrachtgevers.';

-- 2) Publiek leest naast open ook gevulde missies (social proof). Concept,
--    in_review en gearchiveerd blijven privé.
drop policy if exists "publiek leest open missies" on public.missies;

create policy "publiek leest open en gevulde missies"
  on public.missies for select
  to anon, authenticated
  using (status in ('open', 'gevuld'));

-- ====================================================================
-- 20250612120009_plaats_missie.sql
-- ====================================================================
-- Publieke missie-inzending via één gecontroleerde toegangspoort.
--
-- In plaats van anon INSERT-rechten op de tabellen te geven, draait al het
-- schrijven via deze SECURITY DEFINER-functie. Die:
--   • slaat opdrachtgever (privé) + missie atomair op en linkt ze,
--   • forceert status 'in_review' (publiek kan dus nooit een 'open' missie maken),
--   • geeft alleen de slug terug (niets gevoeligs).
-- De tabellen blijven hierdoor volledig dicht voor anon-schrijfacties en de
-- service_role-key hoeft niet op Vercel.
create or replace function public.plaats_missie(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_og_id uuid;
  v_slug  text := payload ->> 'slug';
begin
  insert into public.opdrachtgevers (naam, contactpersoon, email, telefoon)
  values (
    payload ->> 'bedrijf',
    nullif(payload ->> 'naam', ''),
    payload ->> 'email',
    nullif(payload ->> 'telefoon', '')
  )
  returning id into v_og_id;

  insert into public.missies (
    slug, titel, rol, locatie, uren_per_week, duur, tarief_indicatie,
    start_indicatie, status, intro, omschrijving, opdrachtgever_id, opdrachtgever_label
  ) values (
    v_slug,
    payload ->> 'titel',
    payload ->> 'rol',
    nullif(payload ->> 'locatie', ''),
    nullif(payload ->> 'uren_per_week', ''),
    nullif(payload ->> 'duur', ''),
    nullif(payload ->> 'tarief_indicatie', ''),
    nullif(payload ->> 'start_indicatie', ''),
    'in_review',
    nullif(payload ->> 'intro', ''),
    coalesce(
      (select array_agg(value) from jsonb_array_elements_text(payload -> 'omschrijving')),
      '{}'
    ),
    v_og_id,
    payload ->> 'bedrijf'
  );

  return v_slug;
end;
$$;

-- Alleen uitvoerrecht voor anon/authenticated; geen directe tabeltoegang.
revoke all on function public.plaats_missie(jsonb) from public;
grant execute on function public.plaats_missie(jsonb) to anon, authenticated;

-- ====================================================================
-- 20250612120010_admins.sql
-- ====================================================================
-- Admin-allowlist. Eén bron van waarheid voor zowel de /admin-toegang als de
-- RLS-policies (stap 3). Een admin toevoegen = één INSERT, geen redeploy.
--
-- De e-mailadressen staan bewust NIET in deze migratie (niet in git); voeg ze
-- los toe in de SQL-editor, bijv.:
--   insert into public.admins (email) values ('jij@voorbeeld.nl');
create table public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Een ingelogde gebruiker mag alleen zijn eigen admin-rij zien (voor de gate).
-- Niemand kan de tabel uitlezen of wijzigen via de API.
create policy "lees eigen admin-status"
  on public.admins for select
  to authenticated
  using (email = (auth.jwt() ->> 'email'));

comment on table public.admins is 'Allowlist van admin-e-mailadressen voor /admin.';

-- ====================================================================
-- 20250612120011_admin_policies.sql
-- ====================================================================
-- RLS voor beheerders. Herbruikbare helper die checkt of de ingelogde
-- gebruiker op de allowlist staat. SECURITY DEFINER omzeilt de RLS op admins
-- (zo hoeft die tabel niet leesbaar te zijn voor de check).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where email = (auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Beheerders zien álle missies (ook concept/in_review/gearchiveerd) en mogen
-- ze bijwerken (bijv. status van in_review naar open). De publieke leespolicy
-- (open + gevuld) blijft daarnaast bestaan; policies zijn OR-gewijs.
create policy "admins lezen alle missies"
  on public.missies for select
  to authenticated
  using (public.is_admin());

create policy "admins wijzigen missies"
  on public.missies for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Beheerders mogen de (privé) opdrachtgevergegevens lezen bij het beoordelen.
create policy "admins lezen opdrachtgevers"
  on public.opdrachtgevers for select
  to authenticated
  using (public.is_admin());

-- ====================================================================
-- 20250612120012_stars_accounts.sql
-- ====================================================================
-- Invite-only ster-accounts + de vouch-engine.
--
-- Concept: je komt alleen binnen via een uitnodiging (vouch). Wie een geldige
-- vouch gebruikt, wordt automatisch een actieve ster, krijgt een vouch-lijn
-- naar wie hem uitnodigde, én een eigen unieke vouch om eenmalig weg te geven.

-- ── Schema-uitbreidingen ────────────────────────────────────────────────────
alter table public.stars
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists portfolio_url text,
  add column if not exists linkedin_url text;

-- Eén account per ster.
create unique index if not exists stars_user_id_key
  on public.stars (user_id) where user_id is not null;

-- ── Uitnodigingen: één per ster, eenmalig bruikbaar ─────────────────────────
create table public.uitnodigingen (
  id                    uuid primary key default gen_random_uuid(),
  token                 text not null unique,
  uitgever_star_id      uuid references public.stars (id) on delete cascade, -- null = bootstrap (admin)
  gebruikt_door_star_id uuid references public.stars (id) on delete set null,
  status                text not null default 'open'
                        check (status in ('open', 'gebruikt', 'ingetrokken')),
  created_at            timestamptz not null default now(),
  gebruikt_op           timestamptz
);

-- Hooguit één uitnodiging per uitgevende ster.
create unique index uitnodigingen_uitgever_key
  on public.uitnodigingen (uitgever_star_id) where uitgever_star_id is not null;

alter table public.uitnodigingen enable row level security;
-- Geen directe policies: alle toegang loopt via de functies hieronder.

-- ── Publiek: is een uitnodigingstoken geldig? (vóór inloggen) ────────────────
create or replace function public.uitnodiging_info(p_token text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'geldig', u.id is not null,
    'uitnodiger', s.naam
  )
  from public.uitnodigingen u
  left join public.stars s on s.id = u.uitgever_star_id
  where u.token = p_token and u.status = 'open'
  union all
  select jsonb_build_object('geldig', false, 'uitnodiger', null)
  where not exists (
    select 1 from public.uitnodigingen where token = p_token and status = 'open'
  )
  limit 1;
$$;

revoke all on function public.uitnodiging_info(text) from public;
grant execute on function public.uitnodiging_info(text) to anon, authenticated;

-- ── Uitnodiging gebruiken: account → actieve ster + vouch + eigen invite ────
create or replace function public.gebruik_uitnodiging(
  p_token       text,
  p_naam        text,
  p_specialisme text,
  p_seniority   text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite   public.uitnodigingen;
  v_email    text := auth.jwt() ->> 'email';
  v_star_id  uuid;
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd';
  end if;

  -- Al lid?
  if exists (select 1 from public.stars where user_id = auth.uid()) then
    raise exception 'Je hebt al een ster-account';
  end if;

  -- Geldige, openstaande uitnodiging vergrendelen.
  select * into v_invite
  from public.uitnodigingen
  where token = p_token and status = 'open'
  for update;

  if v_invite.id is null then
    raise exception 'Uitnodiging ongeldig of al gebruikt';
  end if;

  -- Nieuwe, direct actieve ster.
  insert into public.stars (naam, specialisme, seniority, beschikbaar, status, email, user_id)
  values (p_naam, p_specialisme, p_seniority, false, 'actief', v_email, auth.uid())
  returning id into v_star_id;

  -- Vouch-lijn van uitnodiger naar nieuwe ster (alleen als er een uitgever is).
  if v_invite.uitgever_star_id is not null then
    insert into public.vouches (van_star_id, naar_star_id)
    values (v_invite.uitgever_star_id, v_star_id)
    on conflict do nothing;
  end if;

  -- Uitnodiging als gebruikt markeren.
  update public.uitnodigingen
  set status = 'gebruikt', gebruikt_door_star_id = v_star_id, gebruikt_op = now()
  where id = v_invite.id;

  -- De nieuwe ster krijgt zelf één vouch om weg te geven.
  insert into public.uitnodigingen (token, uitgever_star_id)
  values (gen_random_uuid()::text, v_star_id);

  return v_star_id;
end;
$$;

revoke all on function public.gebruik_uitnodiging(text, text, text, text) from public;
grant execute on function public.gebruik_uitnodiging(text, text, text, text) to authenticated;

-- ── Eigen profiel lezen (volledige rij, ook privévelden) ────────────────────
create or replace function public.mijn_profiel()
returns setof public.stars
language sql
security definer
set search_path = public
stable
as $$
  select * from public.stars where user_id = auth.uid();
$$;

revoke all on function public.mijn_profiel() from public;
grant execute on function public.mijn_profiel() to authenticated;

-- ── Eigen profiel bijwerken ─────────────────────────────────────────────────
create or replace function public.werk_profiel_bij(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.stars set
    naam          = coalesce(nullif(payload ->> 'naam', ''), naam),
    specialisme   = coalesce(nullif(payload ->> 'specialisme', ''), specialisme),
    seniority     = coalesce(nullif(payload ->> 'seniority', ''), seniority),
    bio           = nullif(payload ->> 'bio', ''),
    portfolio_url = nullif(payload ->> 'portfolio_url', ''),
    linkedin_url  = nullif(payload ->> 'linkedin_url', ''),
    beschikbaar   = coalesce((payload ->> 'beschikbaar')::boolean, beschikbaar),
    tarief_uur    = nullif(payload ->> 'tarief_uur', '')::numeric,
    updated_at    = now()
  where user_id = auth.uid();
end;
$$;

revoke all on function public.werk_profiel_bij(jsonb) from public;
grant execute on function public.werk_profiel_bij(jsonb) to authenticated;

-- ── Eigen uitnodiging tonen (om te delen) ───────────────────────────────────
create or replace function public.mijn_uitnodiging()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object('token', u.token, 'status', u.status)
  from public.uitnodigingen u
  join public.stars s on s.id = u.uitgever_star_id
  where s.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.mijn_uitnodiging() from public;
grant execute on function public.mijn_uitnodiging() to authenticated;

-- ── Admin: bootstrap-uitnodiging aanmaken (voor de eerste designers) ─────────
create or replace function public.maak_bootstrap_uitnodiging()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := gen_random_uuid()::text;
begin
  if not public.is_admin() then
    raise exception 'Alleen beheerders';
  end if;
  insert into public.uitnodigingen (token, uitgever_star_id) values (v_token, null);
  return v_token;
end;
$$;

revoke all on function public.maak_bootstrap_uitnodiging() from public;
grant execute on function public.maak_bootstrap_uitnodiging() to authenticated;

-- ====================================================================
-- 20250612120013_reacties.sql
-- ====================================================================
-- Sterren reageren op open missies.

-- Eén reactie per ster per missie.
alter table public.reacties
  add constraint reacties_missie_star_key unique (missie_id, star_id);

-- Een ingelogde ster reageert op een open missie.
create or replace function public.reageer_op_missie(p_missie_id uuid, p_motivatie text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_star_id uuid;
begin
  select id into v_star_id from public.stars where user_id = auth.uid();
  if v_star_id is null then
    raise exception 'Geen ster-account';
  end if;

  if not exists (select 1 from public.missies where id = p_missie_id and status = 'open') then
    raise exception 'Missie niet beschikbaar';
  end if;

  insert into public.reacties (missie_id, star_id, motivatie, status)
  values (p_missie_id, v_star_id, nullif(p_motivatie, ''), 'nieuw')
  on conflict (missie_id, star_id) do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.reageer_op_missie(uuid, text) from public;
grant execute on function public.reageer_op_missie(uuid, text) to authenticated;

-- Heeft de ingelogde ster al gereageerd op deze missie?
create or replace function public.mijn_reactie(p_missie_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object('status', r.status)
  from public.reacties r
  join public.stars s on s.id = r.star_id
  where r.missie_id = p_missie_id and s.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.mijn_reactie(uuid) from public;
grant execute on function public.mijn_reactie(uuid) to authenticated;

-- ====================================================================
-- 20250612120014_admin_reacties.sql
-- ====================================================================
-- Admin-kant van de reacties: bekijken, ster voorstellen, plaatsing bevestigen.

-- Alle reacties met ster- en missiedetails (alleen voor beheerders).
create or replace function public.admin_reacties()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'reactie_id', r.id,
        'status', r.status,
        'motivatie', r.motivatie,
        'created_at', r.created_at,
        'missie_id', m.id,
        'missie_titel', m.titel,
        'missie_status', m.status,
        'opdrachtgever_label', m.opdrachtgever_label,
        'opdrachtgever_email', o.email,
        'star', jsonb_build_object(
          'naam', s.naam,
          'specialisme', s.specialisme,
          'seniority', s.seniority,
          'email', s.email,
          'portfolio_url', s.portfolio_url,
          'linkedin_url', s.linkedin_url
        )
      ) order by r.created_at desc
    ),
    '[]'::jsonb
  )
  from public.reacties r
  join public.missies m on m.id = r.missie_id
  left join public.stars s on s.id = r.star_id
  left join public.opdrachtgevers o on o.id = m.opdrachtgever_id
  where public.is_admin();
$$;

revoke all on function public.admin_reacties() from public;
grant execute on function public.admin_reacties() to authenticated;

-- Markeer dat een ster is voorgesteld aan de opdrachtgever (de mail zelf
-- verstuurt de app via Resend).
create or replace function public.markeer_voorgesteld(p_reactie_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  update public.reacties set status = 'uitgenodigd' where id = p_reactie_id;
end;
$$;

revoke all on function public.markeer_voorgesteld(uuid) from public;
grant execute on function public.markeer_voorgesteld(uuid) to authenticated;

-- Bevestig een plaatsing: maak plaatsing aan, zet de missie op 'gevuld'.
create or replace function public.bevestig_plaatsing(p_reactie_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_missie uuid;
  v_star   uuid;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;

  select missie_id, star_id into v_missie, v_star
  from public.reacties where id = p_reactie_id;
  if v_missie is null then raise exception 'Reactie niet gevonden'; end if;

  insert into public.plaatsingen (missie_id, star_id, status)
  values (v_missie, v_star, 'actief');

  update public.missies set status = 'gevuld' where id = v_missie;
end;
$$;

revoke all on function public.bevestig_plaatsing(uuid) from public;
grant execute on function public.bevestig_plaatsing(uuid) to authenticated;

-- ====================================================================
-- 20250612120015_profielfotos.sql
-- ====================================================================
-- Profielfoto's: een ster kan een foto uploaden en toestemming geven om die
-- elders op de site te gebruiken.

alter table public.stars
  add column if not exists foto_url text,
  add column if not exists foto_toestemming boolean not null default false;

-- ── Storage-rechten op de bucket 'profielfotos' ─────────────────────────────
-- Pad-conventie: <user_id>/<bestand>. Een ster beheert alleen z'n eigen map.
create policy "publiek leest profielfotos"
  on storage.objects for select to public
  using (bucket_id = 'profielfotos');

create policy "ster uploadt eigen foto"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profielfotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ster vervangt eigen foto"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profielfotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ster verwijdert eigen foto"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profielfotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── werk_profiel_bij uitbreiden met foto + toestemming ──────────────────────
create or replace function public.werk_profiel_bij(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.stars set
    naam          = coalesce(nullif(payload ->> 'naam', ''), naam),
    specialisme   = coalesce(nullif(payload ->> 'specialisme', ''), specialisme),
    seniority     = coalesce(nullif(payload ->> 'seniority', ''), seniority),
    bio           = nullif(payload ->> 'bio', ''),
    portfolio_url = nullif(payload ->> 'portfolio_url', ''),
    linkedin_url  = nullif(payload ->> 'linkedin_url', ''),
    beschikbaar   = coalesce((payload ->> 'beschikbaar')::boolean, beschikbaar),
    tarief_uur    = nullif(payload ->> 'tarief_uur', '')::numeric,
    foto_url      = coalesce(nullif(payload ->> 'foto_url', ''), foto_url),
    foto_toestemming = coalesce((payload ->> 'foto_toestemming')::boolean, foto_toestemming),
    updated_at    = now()
  where user_id = auth.uid();
end;
$$;

revoke all on function public.werk_profiel_bij(jsonb) from public;
grant execute on function public.werk_profiel_bij(jsonb) to authenticated;

-- ====================================================================
-- 20250612120016_publieke_sterren.sql
-- ====================================================================
-- Publieke sterrenlijst voor het sterrenveld, toestemmings-bewust: foto_url
-- komt alleen mee als de ster toestemming gaf om de foto elders te tonen.
create or replace function public.publieke_sterren()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'naam', naam,
        'specialisme', specialisme,
        'seniority', seniority,
        'beschikbaar', beschikbaar,
        'foto_url', case when foto_toestemming then foto_url else null end
      )
    ),
    '[]'::jsonb
  )
  from public.stars
  where status = 'actief';
$$;

revoke all on function public.publieke_sterren() from public;
grant execute on function public.publieke_sterren() to anon, authenticated;

-- ====================================================================
-- 20250612120017_vouch_aanvragen.sql
-- ====================================================================
-- "Vraag een vouch aan": een front door voor geïnteresseerde designers die nog
-- niemand in het stelsel kennen. Een aanvraag geeft GEEN toegang — een mens
-- (admin/lid) beslist of die zijn vouch geeft. Zo blijft de poort dicht.

create table public.vouch_aanvragen (
  id             uuid primary key default gen_random_uuid(),
  naam           text not null,
  email          text not null,
  portfolio_url  text,
  motivatie      text,
  status         text not null default 'nieuw'
                 check (status in ('nieuw', 'uitgenodigd', 'afgewezen')),
  uitnodiging_id uuid references public.uitnodigingen (id) on delete set null,
  created_at     timestamptz not null default now()
);

alter table public.vouch_aanvragen enable row level security;
-- Geen publieke policies; alle toegang loopt via de functies hieronder.

-- ── Publiek: een vouch aanvragen ────────────────────────────────────────────
create or replace function public.vraag_vouch_aan(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(coalesce(payload ->> 'naam', ''))) < 2
     or position('@' in coalesce(payload ->> 'email', '')) = 0 then
    raise exception 'Naam en geldig e-mailadres zijn verplicht';
  end if;

  insert into public.vouch_aanvragen (naam, email, portfolio_url, motivatie)
  values (
    payload ->> 'naam',
    payload ->> 'email',
    nullif(payload ->> 'portfolio_url', ''),
    nullif(payload ->> 'motivatie', '')
  );
end;
$$;

revoke all on function public.vraag_vouch_aan(jsonb) from public;
grant execute on function public.vraag_vouch_aan(jsonb) to anon, authenticated;

-- ── Admin: aanvragen bekijken ───────────────────────────────────────────────
create or replace function public.admin_vouch_aanvragen()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id, 'naam', naam, 'email', email,
        'portfolio_url', portfolio_url, 'motivatie', motivatie,
        'status', status, 'created_at', created_at
      ) order by created_at desc
    ),
    '[]'::jsonb
  )
  from public.vouch_aanvragen
  where public.is_admin();
$$;

revoke all on function public.admin_vouch_aanvragen() from public;
grant execute on function public.admin_vouch_aanvragen() to authenticated;

-- ── Admin: kandidaat uitnodigen (maakt een invite + geeft token terug) ──────
create or replace function public.nodig_kandidaat_uit(p_aanvraag_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_naam  text;
  v_token text := gen_random_uuid()::text;
  v_inv   uuid;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;

  select email, naam into v_email, v_naam
  from public.vouch_aanvragen where id = p_aanvraag_id;
  if v_email is null then raise exception 'Aanvraag niet gevonden'; end if;

  insert into public.uitnodigingen (token, uitgever_star_id)
  values (v_token, null) returning id into v_inv;

  update public.vouch_aanvragen
  set status = 'uitgenodigd', uitnodiging_id = v_inv
  where id = p_aanvraag_id;

  return jsonb_build_object('token', v_token, 'email', v_email, 'naam', v_naam);
end;
$$;

revoke all on function public.nodig_kandidaat_uit(uuid) from public;
grant execute on function public.nodig_kandidaat_uit(uuid) to authenticated;

-- ── Admin: kandidaat afwijzen ───────────────────────────────────────────────
create or replace function public.wijs_kandidaat_af(p_aanvraag_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  update public.vouch_aanvragen set status = 'afgewezen' where id = p_aanvraag_id;
end;
$$;

revoke all on function public.wijs_kandidaat_af(uuid) from public;
grant execute on function public.wijs_kandidaat_af(uuid) to authenticated;



-- ============================================================
-- 20250612120018_bedrijven.sql
-- ============================================================
-- Fase 1A — Bedrijfs-accounts + membership.
--
-- De "bedrijven" zijn de bestaande opdrachtgevers. Ze krijgen nu een eigen
-- account (user_id, net als stars) en een membership-status. Toegang loopt via
-- SECURITY DEFINER-functies; opdrachtgevers heeft bewust geen publieke policy.

-- ── Schema-uitbreidingen ────────────────────────────────────────────────────
alter table public.opdrachtgevers
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists website text,
  add column if not exists logo_url text,
  add column if not exists membership_status text not null default 'geen'
    check (membership_status in ('geen', 'trial', 'actief', 'verlopen')),
  add column if not exists membership_tier text,
  add column if not exists membership_tot timestamptz;

-- Eén bedrijfs-account per gebruiker.
create unique index if not exists opdrachtgevers_user_id_key
  on public.opdrachtgevers (user_id) where user_id is not null;

-- ── Bedrijf aanmaken/koppelen bij eerste login (idempotent) ─────────────────
create or replace function public.maak_bedrijf(p_naam text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_id    uuid;
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd';
  end if;

  select id into v_id from public.opdrachtgevers where user_id = auth.uid();
  if v_id is not null then
    return v_id;
  end if;

  insert into public.opdrachtgevers (naam, email, user_id)
  values (coalesce(nullif(p_naam, ''), 'Mijn bedrijf'), coalesce(v_email, ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.maak_bedrijf(text) from public;
grant execute on function public.maak_bedrijf(text) to authenticated;

-- ── Eigen bedrijf lezen (volledige rij) ─────────────────────────────────────
create or replace function public.mijn_bedrijf()
returns setof public.opdrachtgevers
language sql
security definer
set search_path = public
stable
as $$
  select * from public.opdrachtgevers where user_id = auth.uid();
$$;

revoke all on function public.mijn_bedrijf() from public;
grant execute on function public.mijn_bedrijf() to authenticated;

-- ── Eigen bedrijfsprofiel bijwerken ─────────────────────────────────────────
create or replace function public.werk_bedrijf_bij(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.opdrachtgevers set
    naam           = coalesce(nullif(payload ->> 'naam', ''), naam),
    contactpersoon = nullif(payload ->> 'contactpersoon', ''),
    telefoon       = nullif(payload ->> 'telefoon', ''),
    website        = nullif(payload ->> 'website', ''),
    logo_url       = nullif(payload ->> 'logo_url', '')
  where user_id = auth.uid();
end;
$$;

revoke all on function public.werk_bedrijf_bij(jsonb) from public;
grant execute on function public.werk_bedrijf_bij(jsonb) to authenticated;

-- ── Admin: alle bedrijven met membership + missie-telling ────────────────────
create or replace function public.admin_bedrijven()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'naam', o.naam,
        'email', o.email,
        'contactpersoon', o.contactpersoon,
        'website', o.website,
        'membership_status', o.membership_status,
        'membership_tier', o.membership_tier,
        'membership_tot', o.membership_tot,
        'heeft_account', o.user_id is not null,
        'aantal_missies', (
          select count(*) from public.missies m where m.opdrachtgever_id = o.id
        ),
        'created_at', o.created_at
      )
      order by o.created_at desc
    ),
    '[]'::jsonb
  )
  from public.opdrachtgevers o
  where public.is_admin();
$$;

revoke all on function public.admin_bedrijven() from public;
grant execute on function public.admin_bedrijven() to authenticated;

-- ── Admin: membership zetten (handmatig; Mollie volgt in 1D-2) ───────────────
create or replace function public.zet_membership(
  p_bedrijf_id uuid,
  p_status     text,
  p_tier       text,
  p_tot        timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Geen toegang';
  end if;

  update public.opdrachtgevers set
    membership_status = coalesce(nullif(p_status, ''), membership_status),
    membership_tier   = nullif(p_tier, ''),
    membership_tot    = p_tot
  where id = p_bedrijf_id;
end;
$$;

revoke all on function public.zet_membership(uuid, text, text, timestamptz) from public;
grant execute on function public.zet_membership(uuid, text, text, timestamptz) to authenticated;


-- ============================================================
-- 20250612120019_bedrijf_missies.sql
-- ============================================================
-- Fase 1C — Missie plaatsen vanuit een bedrijfsaccount, achter membership.
--
-- Anders dan plaats_missie (anoniem, maakt elke keer een nieuwe opdrachtgever)
-- gebruikt deze functie het ingelogde bedrijf én eist een actief membership.
-- Status blijft 'in_review' (admin keurt goed).

create or replace function public.plaats_missie_als_bedrijf(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bedrijf public.opdrachtgevers;
  v_slug    text := payload ->> 'slug';
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd';
  end if;

  select * into v_bedrijf from public.opdrachtgevers where user_id = auth.uid();
  if v_bedrijf.id is null then
    raise exception 'Geen bedrijfsaccount';
  end if;

  if not (
    v_bedrijf.membership_status = 'actief'
    and (v_bedrijf.membership_tot is null or v_bedrijf.membership_tot > now())
  ) then
    raise exception 'Geen actief membership';
  end if;

  insert into public.missies (
    slug, titel, rol, locatie, uren_per_week, duur, tarief_indicatie,
    start_indicatie, status, intro, omschrijving, opdrachtgever_id, opdrachtgever_label
  ) values (
    v_slug,
    payload ->> 'titel',
    payload ->> 'rol',
    nullif(payload ->> 'locatie', ''),
    nullif(payload ->> 'uren_per_week', ''),
    nullif(payload ->> 'duur', ''),
    nullif(payload ->> 'tarief_indicatie', ''),
    nullif(payload ->> 'start_indicatie', ''),
    'in_review',
    nullif(payload ->> 'intro', ''),
    coalesce(
      (select array_agg(value) from jsonb_array_elements_text(payload -> 'omschrijving')),
      '{}'
    ),
    v_bedrijf.id,
    v_bedrijf.naam
  );

  return v_slug;
end;
$$;

revoke all on function public.plaats_missie_als_bedrijf(jsonb) from public;
grant execute on function public.plaats_missie_als_bedrijf(jsonb) to authenticated;

-- ── Eigen missies van het bedrijf (alle statussen) ──────────────────────────
create or replace function public.mijn_missies()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'slug', m.slug,
        'titel', m.titel,
        'rol', m.rol,
        'status', m.status,
        'created_at', m.created_at
      )
      order by m.created_at desc
    ),
    '[]'::jsonb
  )
  from public.missies m
  join public.opdrachtgevers o on o.id = m.opdrachtgever_id
  where o.user_id = auth.uid();
$$;

revoke all on function public.mijn_missies() from public;
grant execute on function public.mijn_missies() to authenticated;


-- ============================================================
-- 20250612120020_publieke_leden.sql
-- ============================================================
-- Fase 1E — Community zichtbaar: publieke ledenlijst met vouch-afkomst.
--
-- Toont de actieve sterren met wie hen vouchte ("gevouched door X") en hoeveel
-- vouches ze zelf gaven. Toestemmings-bewust voor de foto (zoals publieke_sterren).

create or replace function public.publieke_leden()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'naam', s.naam,
        'specialisme', s.specialisme,
        'seniority', s.seniority,
        'beschikbaar', s.beschikbaar,
        'bio', s.bio,
        'foto_url', case when s.foto_toestemming then s.foto_url else null end,
        'gevouched_door', (
          select vs.naam
          from public.vouches v
          join public.stars vs on vs.id = v.van_star_id
          where v.naar_star_id = s.id
          order by v.created_at asc
          limit 1
        ),
        'aantal_vouches_gegeven', (
          select count(*) from public.vouches v2 where v2.van_star_id = s.id
        )
      )
      order by s.created_at asc
    ),
    '[]'::jsonb
  )
  from public.stars s
  where s.status = 'actief';
$$;

revoke all on function public.publieke_leden() from public;
grant execute on function public.publieke_leden() to anon, authenticated;


-- ============================================================
-- 20250612120021_plaatsing_deal.sql
-- ============================================================
-- Fase 2A — Deal-type op plaatsingen: Direct of Via UXSTARS.
--
-- Een plaatsing (ster ↔ missie) krijgt een deal_type. Bij 'via_uxstars' leggen
-- we klant- en stertarief vast en rolt de marge eruit. tarief_uur (bestond al)
-- = stertarief. NB: we gebruiken NIET het woord "detachering".

alter table public.plaatsingen
  add column if not exists deal_type text not null default 'direct'
    check (deal_type in ('direct', 'via_uxstars')),
  add column if not exists klant_tarief_uur numeric(8, 2),
  add column if not exists marge_uur numeric(8, 2),
  add column if not exists contract_status text not null default 'concept'
    check (contract_status in ('concept', 'getekend', 'actief', 'afgerond'));

-- ── bevestig_plaatsing uitbreiden met deal-type + tarieven ──────────────────
-- Oude 1-arg-versie weg; nieuwe heeft defaults, dus de bestaande aanroep
-- (alleen p_reactie_id) blijft werken als 'direct' zonder tarieven.
drop function if exists public.bevestig_plaatsing(uuid);

create or replace function public.bevestig_plaatsing(
  p_reactie_id   uuid,
  p_deal_type    text default 'direct',
  p_ster_tarief  numeric default null,
  p_klant_tarief numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_missie uuid;
  v_star   uuid;
  v_marge  numeric;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;

  select missie_id, star_id into v_missie, v_star
  from public.reacties where id = p_reactie_id;
  if v_missie is null then raise exception 'Reactie niet gevonden'; end if;

  if p_deal_type = 'via_uxstars'
     and p_klant_tarief is not null and p_ster_tarief is not null then
    v_marge := p_klant_tarief - p_ster_tarief;
  else
    v_marge := null;
  end if;

  insert into public.plaatsingen (
    missie_id, star_id, status, deal_type, tarief_uur, klant_tarief_uur, marge_uur
  ) values (
    v_missie, v_star, 'actief', coalesce(p_deal_type, 'direct'),
    p_ster_tarief, p_klant_tarief, v_marge
  );

  update public.missies set status = 'gevuld' where id = v_missie;
end;
$$;

revoke all on function public.bevestig_plaatsing(uuid, text, numeric, numeric) from public;
grant execute on function public.bevestig_plaatsing(uuid, text, numeric, numeric) to authenticated;

-- ── Admin: alle plaatsingen met missie/ster/bedrijf + tarieven + marge ──────
create or replace function public.admin_plaatsingen()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'missie_titel', m.titel,
        'missie_slug', m.slug,
        'ster_naam', s.naam,
        'bedrijf_naam', coalesce(o.naam, m.opdrachtgever_label),
        'deal_type', p.deal_type,
        'ster_tarief', p.tarief_uur,
        'klant_tarief', p.klant_tarief_uur,
        'marge_uur', p.marge_uur,
        'contract_status', p.contract_status,
        'status', p.status,
        'created_at', p.created_at
      )
      order by p.created_at desc
    ),
    '[]'::jsonb
  )
  from public.plaatsingen p
  join public.missies m on m.id = p.missie_id
  join public.stars s on s.id = p.star_id
  left join public.opdrachtgevers o on o.id = m.opdrachtgever_id
  where public.is_admin();
$$;

revoke all on function public.admin_plaatsingen() from public;
grant execute on function public.admin_plaatsingen() to authenticated;

-- ── Admin: contractstatus van een plaatsing bijwerken ───────────────────────
create or replace function public.zet_contract_status(p_plaatsing_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Geen toegang'; end if;
  update public.plaatsingen set contract_status = p_status where id = p_plaatsing_id;
end;
$$;

revoke all on function public.zet_contract_status(uuid, text) from public;
grant execute on function public.zet_contract_status(uuid, text) to authenticated;


-- ============================================================
-- 20250612120022_mijn_stelsel.sql
-- ============================================================
-- Gamification — "Jouw tak van het stelsel".
--
-- Voor de ingelogde ster: wie vouchte jou, wie vouchte jij direct, en hoeveel
-- sterren stammen er in totaal van jou af (recursief). Beloont de vouch-moat.

create or replace function public.mijn_stelsel()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_star uuid;
begin
  select id into v_star from public.stars where user_id = auth.uid();
  if v_star is null then
    return jsonb_build_object('gevouched_door', null, 'directe', '[]'::jsonb, 'aantal_afstammelingen', 0);
  end if;

  return jsonb_build_object(
    'gevouched_door', (
      select vs.naam
      from public.vouches v
      join public.stars vs on vs.id = v.van_star_id
      where v.naar_star_id = v_star
      order by v.created_at asc
      limit 1
    ),
    'directe', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'naam', s.naam,
            'specialisme', s.specialisme,
            'beschikbaar', s.beschikbaar,
            'foto_url', case when s.foto_toestemming then s.foto_url else null end
          )
          order by v.created_at asc
        ),
        '[]'::jsonb
      )
      from public.vouches v
      join public.stars s on s.id = v.naar_star_id
      where v.van_star_id = v_star
    ),
    'aantal_afstammelingen', (
      with recursive boom as (
        select naar_star_id as id from public.vouches where van_star_id = v_star
        union
        select v.naar_star_id from public.vouches v join boom b on v.van_star_id = b.id
      )
      select count(*) from boom
    )
  );
end;
$$;

revoke all on function public.mijn_stelsel() from public;
grant execute on function public.mijn_stelsel() to authenticated;


-- ============================================================
-- 20250612120023_bedrijf_leads.sql
-- ============================================================
-- "Breng een opdrachtgever binnen" — de vouch, maar dan voor de vraagkant.
--
-- Een ster beveelt een opdrachtgever aan; die landt als lead in de admin-pool.
-- Toegang loopt volledig via SECURITY DEFINER-functies.

create table if not exists public.bedrijf_leads (
  id            uuid primary key default gen_random_uuid(),
  ster_id       uuid references public.stars (id) on delete set null,
  bedrijf_naam  text not null,
  contact_naam  text,
  contact_email text,
  toelichting   text,
  status        text not null default 'nieuw'
                check (status in ('nieuw', 'benaderd', 'binnen', 'afgewezen')),
  created_at    timestamptz not null default now()
);

create index if not exists bedrijf_leads_ster_idx on public.bedrijf_leads (ster_id);

alter table public.bedrijf_leads enable row level security;
-- Geen directe policies: alles via de functies hieronder.

-- ── Ster beveelt een opdrachtgever aan ──────────────────────────────────────
create or replace function public.beveel_bedrijf_aan(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_star uuid;
begin
  select id into v_star from public.stars where user_id = auth.uid();
  if v_star is null then raise exception 'Geen ster-account'; end if;
  if coalesce(trim(payload ->> 'bedrijf_naam'), '') = '' then
    raise exception 'Bedrijfsnaam ontbreekt';
  end if;

  insert into public.bedrijf_leads (ster_id, bedrijf_naam, contact_naam, contact_email, toelichting)
  values (
    v_star,
    payload ->> 'bedrijf_naam',
    nullif(payload ->> 'contact_naam', ''),
    nullif(payload ->> 'contact_email', ''),
    nullif(payload ->> 'toelichting', '')
  );
end;
$$;

revoke all on function public.beveel_bedrijf_aan(jsonb) from public;
grant execute on function public.beveel_bedrijf_aan(jsonb) to authenticated;

-- ── Eigen aanbevelingen van de ster (met status) ────────────────────────────
create or replace function public.mijn_aanbevelingen()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', l.id, 'bedrijf_naam', l.bedrijf_naam,
        'status', l.status, 'created_at', l.created_at
      ) order by l.created_at desc
    ), '[]'::jsonb
  )
  from public.bedrijf_leads l
  join public.stars s on s.id = l.ster_id
  where s.user_id = auth.uid();
$$;

revoke all on function public.mijn_aanbevelingen() from public;
grant execute on function public.mijn_aanbevelingen() to authenticated;

-- ── Admin: alle leads (met aanbrenger) ──────────────────────────────────────
create or replace function public.admin_bedrijf_leads()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', l.id, 'bedrijf_naam', l.bedrijf_naam, 'contact_naam', l.contact_naam,
        'contact_email', l.contact_email, 'toelichting', l.toelichting,
        'status', l.status, 'ster_naam', s.naam, 'created_at', l.created_at
      ) order by l.created_at desc
    ), '[]'::jsonb
  )
  from public.bedrijf_leads l
  left join public.stars s on s.id = l.ster_id
  where public.is_admin();
$$;

revoke all on function public.admin_bedrijf_leads() from public;
grant execute on function public.admin_bedrijf_leads() to authenticated;

-- ── Admin: lead-status bijwerken ────────────────────────────────────────────
create or replace function public.zet_lead_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Geen toegang'; end if;
  update public.bedrijf_leads set status = p_status where id = p_id;
end;
$$;

revoke all on function public.zet_lead_status(uuid, text) from public;
grant execute on function public.zet_lead_status(uuid, text) to authenticated;
