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


-- ============================================================
-- 20250612120024_verwijder_aanvraag.sql
-- ============================================================
-- Admin kan een vouch-aanvraag verwijderen (opschonen van de kandidatenpool).
create or replace function public.verwijder_vouch_aanvraag(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Geen toegang'; end if;
  delete from public.vouch_aanvragen where id = p_id;
end;
$$;

revoke all on function public.verwijder_vouch_aanvraag(uuid) from public;
grant execute on function public.verwijder_vouch_aanvraag(uuid) to authenticated;


-- ============================================================
-- 20250612120025_membership_trial.sql
-- ============================================================
-- Bedrijf start zelf een membership-proefperiode + legt de plankeuze vast.
-- Nieuw/verlopen → 30 dagen trial; al actief/trial → alleen de tier-keuze.
-- (De echte betaling volgt later via Stripe.)

create or replace function public.start_membership_trial(p_tier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd'; end if;

  select id into v_id from public.opdrachtgevers where user_id = auth.uid();
  if v_id is null then raise exception 'Geen bedrijfsaccount'; end if;

  update public.opdrachtgevers set
    membership_tier   = nullif(p_tier, ''),
    membership_status = 'trial',
    membership_tot    = now() + interval '30 days'
  where id = v_id and membership_status in ('geen', 'verlopen');

  update public.opdrachtgevers set
    membership_tier = nullif(p_tier, '')
  where id = v_id and membership_status not in ('geen', 'verlopen');
end;
$$;

revoke all on function public.start_membership_trial(text) from public;
grant execute on function public.start_membership_trial(text) to authenticated;


-- ============================================================
-- 20250612120026_trial_mag_plaatsen.sql
-- ============================================================
-- Fix: een bedrijf met een trial (niet alleen 'actief') mag missies plaatsen.
-- plaats_missie_als_bedrijf accepteert nu membership_status in ('actief','trial').

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
    v_bedrijf.membership_status in ('actief', 'trial')
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


-- ============================================================
-- 20250612120027_stripe_velden.sql
-- ============================================================
-- Stripe-koppeling op bedrijven: customer + subscription voor membership-betaling.
alter table public.opdrachtgevers
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists opdrachtgevers_stripe_customer_idx
  on public.opdrachtgevers (stripe_customer_id);


-- ============================================================
-- 20250612120028_missie_bewerken.sql
-- ============================================================
-- Bedrijf kan eigen missies bewerken; mijn_missies geeft alle velden terug.

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
        'locatie', m.locatie,
        'uren_per_week', m.uren_per_week,
        'duur', m.duur,
        'tarief_indicatie', m.tarief_indicatie,
        'start_indicatie', m.start_indicatie,
        'intro', m.intro,
        'omschrijving', m.omschrijving,
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

create or replace function public.werk_missie_bij(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bedrijf public.opdrachtgevers;
  v_missie  public.missies;
  v_id      uuid := (payload ->> 'id')::uuid;
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd';
  end if;

  select * into v_bedrijf from public.opdrachtgevers where user_id = auth.uid();
  if v_bedrijf.id is null then
    raise exception 'Geen bedrijfsaccount';
  end if;

  select * into v_missie from public.missies where id = v_id;
  if v_missie.id is null or v_missie.opdrachtgever_id is distinct from v_bedrijf.id then
    raise exception 'Geen toegang tot deze missie';
  end if;

  if v_missie.status in ('gevuld', 'gearchiveerd') then
    raise exception 'Deze missie kan niet meer worden aangepast';
  end if;

  update public.missies set
    titel = coalesce(nullif(payload ->> 'titel', ''), titel),
    rol = coalesce(nullif(payload ->> 'rol', ''), rol),
    locatie = nullif(payload ->> 'locatie', ''),
    uren_per_week = nullif(payload ->> 'uren_per_week', ''),
    duur = nullif(payload ->> 'duur', ''),
    tarief_indicatie = nullif(payload ->> 'tarief_indicatie', ''),
    start_indicatie = nullif(payload ->> 'start_indicatie', ''),
    intro = nullif(payload ->> 'intro', ''),
    omschrijving = coalesce(
      (select array_agg(value) from jsonb_array_elements_text(payload -> 'omschrijving')),
      omschrijving
    ),
    updated_at = now()
  where id = v_id;
end;
$$;

revoke all on function public.werk_missie_bij(jsonb) from public;
grant execute on function public.werk_missie_bij(jsonb) to authenticated;


-- ============================================================
-- 20250612120029_cron_nudges.sql
-- ============================================================
-- Cron-nudges: vouch-herinnering + beschikbaarheids-ping.

alter table public.stars
  add column if not exists vouch_herinnerd_op timestamptz,
  add column if not exists beschikbaarheid_gepingd_op timestamptz;

create or replace function public.cron_vouch_kandidaten()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('id', x.id, 'naam', x.naam, 'email', x.email, 'token', x.token)),
    '[]'::jsonb
  )
  from (
    select distinct on (s.id) s.id, s.naam, s.email, u.token
    from public.stars s
    join public.uitnodigingen u
      on u.uitgever_star_id = s.id and u.status = 'open'
    where s.email is not null
      and s.email not ilike '%.example'
      and s.email not ilike '%.test'
      and s.email not ilike '%.invalid'
      and s.status in ('actief', 'gevouched')
      and s.created_at < now() - interval '3 days'
      and (s.vouch_herinnerd_op is null or s.vouch_herinnerd_op < now() - interval '21 days')
    order by s.id, u.created_at desc
    limit 50
  ) x;
$$;

create or replace function public.cron_beschikbaarheid_kandidaten()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('id', s.id, 'naam', s.naam, 'email', s.email)),
    '[]'::jsonb
  )
  from public.stars s
  where s.email is not null
    and s.email not ilike '%.example'
    and s.email not ilike '%.test'
    and s.email not ilike '%.invalid'
    and s.status = 'actief'
    and s.updated_at < now() - interval '30 days'
    and (s.beschikbaarheid_gepingd_op is null or s.beschikbaarheid_gepingd_op < now() - interval '30 days')
  limit 50;
$$;

create or replace function public.cron_markeer_vouch_nudge(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.stars set vouch_herinnerd_op = now() where id = p_id;
$$;

create or replace function public.cron_markeer_beschikbaarheid_nudge(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.stars set beschikbaarheid_gepingd_op = now() where id = p_id;
$$;

revoke all on function public.cron_vouch_kandidaten() from public, anon, authenticated;
revoke all on function public.cron_beschikbaarheid_kandidaten() from public, anon, authenticated;
revoke all on function public.cron_markeer_vouch_nudge(uuid) from public, anon, authenticated;
revoke all on function public.cron_markeer_beschikbaarheid_nudge(uuid) from public, anon, authenticated;
grant execute on function public.cron_vouch_kandidaten() to service_role;
grant execute on function public.cron_beschikbaarheid_kandidaten() to service_role;
grant execute on function public.cron_markeer_vouch_nudge(uuid) to service_role;
grant execute on function public.cron_markeer_beschikbaarheid_nudge(uuid) to service_role;


-- ============================================================
-- 20250612120030_vouch_vangnet.sql
-- ============================================================
-- Vouch-vangnet: nette melding bij gelijktijdige dubbel-signup (race).

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

  if exists (select 1 from public.stars where user_id = auth.uid()) then
    raise exception 'Je hebt al een ster-account';
  end if;

  select * into v_invite
  from public.uitnodigingen
  where token = p_token and status = 'open'
  for update;

  if v_invite.id is null then
    raise exception 'Uitnodiging ongeldig of al gebruikt';
  end if;

  begin
    insert into public.stars (naam, specialisme, seniority, beschikbaar, status, email, user_id)
    values (p_naam, p_specialisme, p_seniority, false, 'actief', v_email, auth.uid())
    returning id into v_star_id;
  exception when unique_violation then
    raise exception 'Je hebt al een ster-account';
  end;

  if v_invite.uitgever_star_id is not null then
    insert into public.vouches (van_star_id, naar_star_id)
    values (v_invite.uitgever_star_id, v_star_id)
    on conflict do nothing;
  end if;

  update public.uitnodigingen
  set status = 'gebruikt', gebruikt_door_star_id = v_star_id, gebruikt_op = now()
  where id = v_invite.id;

  insert into public.uitnodigingen (token, uitgever_star_id)
  values (gen_random_uuid()::text, v_star_id);

  return v_star_id;
end;
$$;

revoke all on function public.gebruik_uitnodiging(text, text, text, text) from public;
grant execute on function public.gebruik_uitnodiging(text, text, text, text) to authenticated;


-- ============================================================
-- 20250612120031_vouch_codes.sql
-- ============================================================
-- Korte typbare vouch-code (STAR-XXXX) naast de UUID-token + kras-onthulling.

create or replace function public.genereer_vouch_code()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_alfabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code    text;
  i         int;
begin
  loop
    v_code := 'STAR-';
    for i in 1..4 loop
      v_code := v_code || substr(v_alfabet, 1 + floor(random() * length(v_alfabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.uitnodigingen where code = v_code);
  end loop;
  return v_code;
end; $$;

alter table public.uitnodigingen add column if not exists code text;

do $$
declare r record;
begin
  for r in select id from public.uitnodigingen where code is null loop
    update public.uitnodigingen set code = public.genereer_vouch_code() where id = r.id;
  end loop;
end $$;

alter table public.uitnodigingen alter column code set default public.genereer_vouch_code();
create unique index if not exists uitnodigingen_code_key on public.uitnodigingen (code);

create or replace function public.mijn_uitnodiging()
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object('token', u.token, 'code', u.code, 'status', u.status)
  from public.uitnodigingen u
  join public.stars s on s.id = u.uitgever_star_id
  where s.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.uitnodiging_via_code(p_code text)
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(
    (
      select jsonb_build_object('geldig', true, 'uitnodiger', s.naam, 'token', u.token)
      from public.uitnodigingen u
      left join public.stars s on s.id = u.uitgever_star_id
      where upper(u.code) = upper(trim(p_code)) and u.status = 'open'
      limit 1
    ),
    jsonb_build_object('geldig', false, 'uitnodiger', null, 'token', null)
  );
$$;

revoke all on function public.uitnodiging_via_code(text) from public;
grant execute on function public.uitnodiging_via_code(text) to anon, authenticated;


-- ============================================================
-- 20250612120032_vouch_review.sql
-- ============================================================
-- Admin-review op de member-vouch flow: inwisselen -> pending ('gevouched'),
-- admin keurt goed (-> actief + eigen vouch) of wijst af (-> afgewezen).

alter table public.stars drop constraint if exists stars_status_check;
alter table public.stars
  add constraint stars_status_check
  check (status in ('aangevraagd', 'gevouched', 'actief', 'gepauzeerd', 'afgewezen'));

create or replace function public.gebruik_uitnodiging(
  p_token text, p_naam text, p_specialisme text, p_seniority text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_invite  public.uitnodigingen;
  v_email   text := auth.jwt() ->> 'email';
  v_star_id uuid;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd'; end if;
  if exists (select 1 from public.stars where user_id = auth.uid())
    then raise exception 'Je hebt al een ster-account'; end if;
  select * into v_invite from public.uitnodigingen
    where token = p_token and status = 'open' for update;
  if v_invite.id is null then raise exception 'Uitnodiging ongeldig of al gebruikt'; end if;
  begin
    insert into public.stars (naam, specialisme, seniority, beschikbaar, status, email, user_id)
    values (p_naam, p_specialisme, p_seniority, false, 'gevouched', v_email, auth.uid())
    returning id into v_star_id;
  exception when unique_violation then
    raise exception 'Je hebt al een ster-account';
  end;
  update public.uitnodigingen
    set status = 'gebruikt', gebruikt_door_star_id = v_star_id, gebruikt_op = now()
    where id = v_invite.id;
  return v_star_id;
end; $$;
revoke all on function public.gebruik_uitnodiging(text, text, text, text) from public;
grant execute on function public.gebruik_uitnodiging(text, text, text, text) to authenticated;

create or replace function public.uitnodiging_info(p_token text)
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object('geldig', u.id is not null, 'uitnodiger', s.naam, 'code', u.code)
  from public.uitnodigingen u
  left join public.stars s on s.id = u.uitgever_star_id
  where u.token = p_token and u.status = 'open'
  union all
  select jsonb_build_object('geldig', false, 'uitnodiger', null, 'code', null)
  where not exists (select 1 from public.uitnodigingen where token = p_token and status = 'open')
  limit 1;
$$;

create or replace function public.admin_wachtende_sterren()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'naam', s.naam, 'specialisme', s.specialisme, 'seniority', s.seniority,
      'email', s.email, 'uitnodiger', uitg.naam, 'created_at', s.created_at
    ) order by s.created_at asc), '[]'::jsonb)
  from public.stars s
  left join public.uitnodigingen u on u.gebruikt_door_star_id = s.id
  left join public.stars uitg on uitg.id = u.uitgever_star_id
  where public.is_admin() and s.status = 'gevouched';
$$;

create or replace function public.keur_ster_goed(p_star_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_star public.stars; v_uitgever uuid;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  select * into v_star from public.stars where id = p_star_id and status = 'gevouched';
  if v_star.id is null then raise exception 'Geen wachtende aanmelding'; end if;
  update public.stars set status = 'actief', updated_at = now() where id = p_star_id;
  select uitgever_star_id into v_uitgever from public.uitnodigingen
    where gebruikt_door_star_id = p_star_id limit 1;
  if v_uitgever is not null then
    insert into public.vouches (van_star_id, naar_star_id)
    values (v_uitgever, p_star_id) on conflict do nothing;
  end if;
  if not exists (select 1 from public.uitnodigingen where uitgever_star_id = p_star_id) then
    insert into public.uitnodigingen (token, uitgever_star_id)
    values (gen_random_uuid()::text, p_star_id);
  end if;
  return jsonb_build_object('email', v_star.email, 'naam', v_star.naam);
end; $$;
revoke all on function public.keur_ster_goed(uuid) from public;
grant execute on function public.keur_ster_goed(uuid) to authenticated;

create or replace function public.wijs_ster_af(p_star_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_star public.stars;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  select * into v_star from public.stars where id = p_star_id and status = 'gevouched';
  if v_star.id is null then raise exception 'Geen wachtende aanmelding'; end if;
  update public.stars set status = 'afgewezen', updated_at = now() where id = p_star_id;
  return jsonb_build_object('email', v_star.email, 'naam', v_star.naam);
end; $$;
revoke all on function public.wijs_ster_af(uuid) from public;
grant execute on function public.wijs_ster_af(uuid) to authenticated;


-- ============================================================
-- 20250612120033_uitnodiging_bedoeld_voor.sql
-- ============================================================
-- Voor welk e-mailadres is de vouch bedoeld (voor prefill op de aanmeld-stap).

alter table public.uitnodigingen add column if not exists bedoeld_voor text;

create or replace function public.uitnodiging_info(p_token text)
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object('geldig', u.id is not null, 'uitnodiger', s.naam,
    'code', u.code, 'bedoeld_voor', u.bedoeld_voor)
  from public.uitnodigingen u
  left join public.stars s on s.id = u.uitgever_star_id
  where u.token = p_token and u.status = 'open'
  union all
  select jsonb_build_object('geldig', false, 'uitnodiger', null, 'code', null, 'bedoeld_voor', null)
  where not exists (select 1 from public.uitnodigingen where token = p_token and status = 'open')
  limit 1;
$$;


-- ============================================================
-- 20250612120034_aanmelding_details.sql
-- ============================================================
-- Aanmeldingen tonen ook portfolio/linkedin/bio voor de admin-beoordeling.

create or replace function public.admin_wachtende_sterren()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'naam', s.naam, 'specialisme', s.specialisme, 'seniority', s.seniority,
      'email', s.email, 'portfolio_url', s.portfolio_url, 'linkedin_url', s.linkedin_url,
      'bio', s.bio, 'uitnodiger', uitg.naam, 'created_at', s.created_at
    ) order by s.created_at asc), '[]'::jsonb)
  from public.stars s
  left join public.uitnodigingen u on u.gebruikt_door_star_id = s.id
  left join public.stars uitg on uitg.id = u.uitgever_star_id
  where public.is_admin() and s.status = 'gevouched';
$$;


-- ============================================================
-- 20250612120035_missie_logo.sql
-- ============================================================
-- Bedrijfslogo op de missie (job-board-thumbnails).

alter table public.missies add column if not exists opdrachtgever_logo text;

create or replace function public.plaats_missie_als_bedrijf(payload jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare v_bedrijf public.opdrachtgevers; v_slug text := payload ->> 'slug';
begin
  if auth.uid() is null then raise exception 'Niet ingelogd'; end if;
  select * into v_bedrijf from public.opdrachtgevers where user_id = auth.uid();
  if v_bedrijf.id is null then raise exception 'Geen bedrijfsaccount'; end if;
  if not (v_bedrijf.membership_status in ('actief','trial')
      and (v_bedrijf.membership_tot is null or v_bedrijf.membership_tot > now()))
    then raise exception 'Geen actief membership'; end if;
  insert into public.missies (
    slug, titel, rol, locatie, uren_per_week, duur, tarief_indicatie,
    start_indicatie, status, intro, omschrijving, opdrachtgever_id,
    opdrachtgever_label, opdrachtgever_logo
  ) values (
    v_slug, payload->>'titel', payload->>'rol', nullif(payload->>'locatie',''),
    nullif(payload->>'uren_per_week',''), nullif(payload->>'duur',''),
    nullif(payload->>'tarief_indicatie',''), nullif(payload->>'start_indicatie',''),
    'in_review', nullif(payload->>'intro',''),
    coalesce((select array_agg(value) from jsonb_array_elements_text(payload->'omschrijving')), '{}'),
    v_bedrijf.id, v_bedrijf.naam, v_bedrijf.logo_url
  );
  return v_slug;
end; $$;
revoke all on function public.plaats_missie_als_bedrijf(jsonb) from public;
grant execute on function public.plaats_missie_als_bedrijf(jsonb) to authenticated;

update public.missies m set opdrachtgever_logo = o.logo_url
from public.opdrachtgevers o
where m.opdrachtgever_id = o.id and m.opdrachtgever_logo is null and o.logo_url is not null;


-- ============================================================
-- 20250612120036_sync_missie_bedrijf.sql
-- ============================================================
-- Sync gedenormaliseerd logo + label op missies met het bedrijf (trigger).

create or replace function public.sync_missie_bedrijf()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.logo_url is distinct from old.logo_url
     or new.naam is distinct from old.naam then
    update public.missies
    set opdrachtgever_logo = new.logo_url, opdrachtgever_label = new.naam
    where opdrachtgever_id = new.id;
  end if;
  return new;
end; $$;

drop trigger if exists trg_sync_missie_bedrijf on public.opdrachtgevers;
create trigger trg_sync_missie_bedrijf
  after update of logo_url, naam on public.opdrachtgevers
  for each row execute function public.sync_missie_bedrijf();


-- ============================================================
-- 20250612120037_aanmeldingen.sql
-- ============================================================
-- Nieuwe, account-loze aanmeld-flow. Je solliciteert eerst (aanmelding), pas na
-- goedkeuring wordt je account + ster aangemaakt. Vervangt de "account vóór
-- goedkeuring"-aanpak.

create table if not exists public.aanmeldingen (
  id                 uuid primary key default gen_random_uuid(),
  uitnodiging_id     uuid references public.uitnodigingen (id) on delete set null,
  naam               text not null,
  email              text not null,
  rol                text not null,
  seniority          text not null,
  portfolio_url      text,
  portfolio_bestand  text,
  cv_bestand         text,
  motivatie          text,
  status             text not null default 'nieuw'
                     check (status in ('nieuw', 'goedgekeurd', 'afgewezen')),
  ster_id            uuid references public.stars (id) on delete set null,
  created_at         timestamptz not null default now()
);

alter table public.aanmeldingen enable row level security;
-- Geen directe policies: alles loopt via de functies hieronder.

-- Indienen (publiek). Bij een netwerk-vouch moet de token geldig+open zijn; die
-- wordt meteen als gebruikt gemarkeerd zodat 'ie niet nogmaals kan.
create or replace function public.dien_aanmelding_in(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token  text := payload ->> 'token';
  v_invite public.uitnodigingen;
  v_id     uuid;
begin
  if v_token is not null and v_token <> '' then
    select * into v_invite from public.uitnodigingen
    where token = v_token and status = 'open' for update;
    if v_invite.id is null then
      raise exception 'Uitnodiging ongeldig of al gebruikt';
    end if;
    update public.uitnodigingen set status = 'gebruikt', gebruikt_op = now()
    where id = v_invite.id;
  end if;

  insert into public.aanmeldingen (
    uitnodiging_id, naam, email, rol, seniority,
    portfolio_url, portfolio_bestand, cv_bestand, motivatie
  ) values (
    v_invite.id,
    payload ->> 'naam',
    lower(payload ->> 'email'),
    payload ->> 'rol',
    payload ->> 'seniority',
    nullif(payload ->> 'portfolio_url', ''),
    nullif(payload ->> 'portfolio_bestand', ''),
    nullif(payload ->> 'cv_bestand', ''),
    nullif(payload ->> 'motivatie', '')
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.dien_aanmelding_in(jsonb) from public;
grant execute on function public.dien_aanmelding_in(jsonb) to anon, authenticated;

-- Admin: openstaande aanmeldingen met alle beoordelingsgegevens.
create or replace function public.admin_aanmeldingen()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'naam', a.naam, 'email', a.email, 'rol', a.rol,
      'seniority', a.seniority, 'portfolio_url', a.portfolio_url,
      'portfolio_bestand', a.portfolio_bestand, 'cv_bestand', a.cv_bestand,
      'motivatie', a.motivatie, 'uitnodiger', s.naam, 'created_at', a.created_at
    ) order by a.created_at asc), '[]'::jsonb)
  from public.aanmeldingen a
  left join public.uitnodigingen u on u.id = a.uitnodiging_id
  left join public.stars s on s.id = u.uitgever_star_id
  where public.is_admin() and a.status = 'nieuw';
$$;

revoke all on function public.admin_aanmeldingen() from public;
grant execute on function public.admin_aanmeldingen() to authenticated;

-- Admin: goedkeuren → maak een actieve ster uit de aanmelding (user_id komt uit
-- de app-laag, die de auth-user aanmaakt). Reikt de eigen vouch + vouch-lijn uit.
create or replace function public.maak_ster_uit_aanmelding(p_id uuid, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a         public.aanmeldingen;
  v_star_id uuid;
  v_uitgever uuid;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  select * into a from public.aanmeldingen where id = p_id and status = 'nieuw';
  if a.id is null then raise exception 'Geen openstaande aanmelding'; end if;

  begin
    insert into public.stars (
      naam, specialisme, seniority, beschikbaar, status, email, user_id,
      portfolio_url, bio
    ) values (
      a.naam, a.rol, a.seniority, false, 'actief', a.email, p_user_id,
      a.portfolio_url, a.motivatie
    ) returning id into v_star_id;
  exception when unique_violation then
    raise exception 'Deze kandidaat heeft al een ster-account';
  end;

  select uitgever_star_id into v_uitgever from public.uitnodigingen where id = a.uitnodiging_id;
  if v_uitgever is not null then
    insert into public.vouches (van_star_id, naar_star_id)
    values (v_uitgever, v_star_id) on conflict do nothing;
  end if;

  insert into public.uitnodigingen (token, uitgever_star_id)
  values (gen_random_uuid()::text, v_star_id);

  update public.aanmeldingen set status = 'goedgekeurd', ster_id = v_star_id where id = p_id;

  return jsonb_build_object('email', a.email, 'naam', a.naam, 'star_id', v_star_id);
end;
$$;

revoke all on function public.maak_ster_uit_aanmelding(uuid, uuid) from public;
grant execute on function public.maak_ster_uit_aanmelding(uuid, uuid) to authenticated;

-- Admin: afwijzen.
create or replace function public.wijs_aanmelding_af(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare a public.aanmeldingen;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  select * into a from public.aanmeldingen where id = p_id and status = 'nieuw';
  if a.id is null then raise exception 'Geen openstaande aanmelding'; end if;
  update public.aanmeldingen set status = 'afgewezen' where id = p_id;
  return jsonb_build_object('email', a.email, 'naam', a.naam);
end;
$$;

revoke all on function public.wijs_aanmelding_af(uuid) from public;
grant execute on function public.wijs_aanmelding_af(uuid) to authenticated;

-- Opslag voor CV/portfolio-bestanden. Publieke bucket (unguessbare paden),
-- anon mag uploaden (de aanmelder is nog niet ingelogd).
insert into storage.buckets (id, name, public)
values ('aanmeldingen', 'aanmeldingen', true)
on conflict (id) do nothing;

drop policy if exists "aanmelding upload" on storage.objects;
create policy "aanmelding upload" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'aanmeldingen');

drop policy if exists "aanmelding read" on storage.objects;
create policy "aanmelding read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'aanmeldingen');


-- ============================================================
-- 20250612120038_mijn_reacties.sql
-- ============================================================
-- Een ster ziet z'n eigen reacties op missies terug.

create or replace function public.mijn_reacties()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'missie_titel', m.titel, 'missie_slug', m.slug,
      'missie_status', m.status, 'status', r.status, 'created_at', r.created_at
    ) order by r.created_at desc), '[]'::jsonb)
  from public.reacties r
  join public.missies m on m.id = r.missie_id
  join public.stars s on s.id = r.star_id
  where s.user_id = auth.uid();
$$;
revoke all on function public.mijn_reacties() from public;
grant execute on function public.mijn_reacties() to authenticated;


-- ============================================================
-- 20250612120039_wachtlijst.sql
-- ============================================================
-- Pre-launch wachtlijst (designers + opdrachtgevers).

create table if not exists public.wachtlijst (
  id uuid primary key default gen_random_uuid(),
  naam text, email text not null,
  type text not null check (type in ('designer', 'opdrachtgever')),
  created_at timestamptz not null default now(),
  unique (email, type)
);
alter table public.wachtlijst enable row level security;

create or replace function public.meld_wachtlijst_aan(payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(payload->>'email')); v_type text := payload->>'type';
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Ongeldig e-mailadres'; end if;
  if v_type not in ('designer','opdrachtgever') then v_type := 'designer'; end if;
  insert into public.wachtlijst (naam, email, type)
  values (nullif(trim(payload->>'naam'),''), v_email, v_type)
  on conflict (email, type) do nothing;
end; $$;
revoke all on function public.meld_wachtlijst_aan(jsonb) from public;
grant execute on function public.meld_wachtlijst_aan(jsonb) to anon, authenticated;

create or replace function public.admin_wachtlijst()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',w.id,'naam',w.naam,'email',w.email,
    'type',w.type,'created_at',w.created_at) order by w.created_at desc), '[]'::jsonb)
  from public.wachtlijst w where public.is_admin();
$$;
revoke all on function public.admin_wachtlijst() from public;
grant execute on function public.admin_wachtlijst() to authenticated;

-- ============================================================
-- 20250612120040_wachtlijst_verwerking.sql
-- ============================================================
-- Wachtlijst-verwerking: geef admins acties op pre-launch aanmeldingen.
-- Status + de mogelijkheid om iemand uit te nodigen (designer -> founder-vouch)
-- of af te wijzen.

alter table public.wachtlijst
  add column if not exists status text not null default 'nieuw'
    check (status in ('nieuw', 'uitgenodigd', 'benaderd', 'afgewezen')),
  add column if not exists uitnodiging_id uuid
    references public.uitnodigingen (id) on delete set null,
  add column if not exists verwerkt_op timestamptz;

-- admin_wachtlijst: nu inclusief status + (indien uitgenodigd) het invite-token.
create or replace function public.admin_wachtlijst()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', w.id, 'naam', w.naam, 'email', w.email, 'type', w.type,
      'status', w.status, 'created_at', w.created_at,
      'uitnodiging_token', u.token
    ) order by w.created_at desc), '[]'::jsonb)
  from public.wachtlijst w
  left join public.uitnodigingen u on u.id = w.uitnodiging_id
  where public.is_admin();
$$;
revoke all on function public.admin_wachtlijst() from public;
grant execute on function public.admin_wachtlijst() to authenticated;

-- Zet de status van een wachtlijst-item (afwijzen, benaderd, of terugzetten).
create or replace function public.zet_wachtlijst_status(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  if p_status not in ('nieuw', 'uitgenodigd', 'benaderd', 'afgewezen') then
    raise exception 'Ongeldige status';
  end if;
  update public.wachtlijst
    set status = p_status,
        verwerkt_op = case when p_status = 'nieuw' then null else now() end
  where id = p_id;
end; $$;
revoke all on function public.zet_wachtlijst_status(uuid, text) from public;
grant execute on function public.zet_wachtlijst_status(uuid, text) to authenticated;

-- Nodig een wachtlijst-designer uit: maak een founder-vouch (bootstrap-uitnodiging
-- zonder uitgevende ster) en koppel die aan het wachtlijst-item. Geeft het token
-- terug zodat de server-actie er een /uitnodiging-link + mail van maakt.
create or replace function public.nodig_wachtlijst_uit(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_email text; v_naam text; v_type text;
  v_token text := gen_random_uuid()::text;
  v_inv   uuid;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;

  select email, naam, type into v_email, v_naam, v_type
  from public.wachtlijst where id = p_id;
  if v_email is null then raise exception 'Wachtlijst-item niet gevonden'; end if;

  insert into public.uitnodigingen (token, uitgever_star_id)
  values (v_token, null) returning id into v_inv;

  update public.wachtlijst
    set status = 'uitgenodigd', uitnodiging_id = v_inv, verwerkt_op = now()
  where id = p_id;

  return jsonb_build_object(
    'token', v_token, 'email', v_email, 'naam', coalesce(v_naam, ''), 'type', v_type
  );
end; $$;
revoke all on function public.nodig_wachtlijst_uit(uuid) from public;
grant execute on function public.nodig_wachtlijst_uit(uuid) to authenticated;

-- ============================================================
-- 20250612120041_dashboard_stats.sql
-- ============================================================
-- Data-dashboard voor de admin: één functie die de belangrijkste cijfers
-- teruggeeft (wachtlijst, aanmeldingen, sterren, missies, opdrachtgevers) plus
-- een 30-daagse reeks van wachtlijst-aanmeldingen voor een grafiek.

create or replace function public.dashboard_stats()
returns jsonb language sql security definer set search_path = public stable as $$
  select case when not public.is_admin() then '{}'::jsonb else jsonb_build_object(
    'wachtlijst', jsonb_build_object(
      'totaal',         (select count(*) from public.wachtlijst),
      'designers',      (select count(*) from public.wachtlijst where type = 'designer'),
      'opdrachtgevers', (select count(*) from public.wachtlijst where type = 'opdrachtgever'),
      'nieuw',          (select count(*) from public.wachtlijst where status = 'nieuw'),
      'uitgenodigd',    (select count(*) from public.wachtlijst where status = 'uitgenodigd'),
      'benaderd',       (select count(*) from public.wachtlijst where status = 'benaderd'),
      'afgewezen',      (select count(*) from public.wachtlijst where status = 'afgewezen'),
      'laatste7',       (select count(*) from public.wachtlijst where created_at >= now() - interval '7 days'),
      'laatste30',      (select count(*) from public.wachtlijst where created_at >= now() - interval '30 days')
    ),
    'reeks', (
      select coalesce(jsonb_agg(jsonb_build_object(
          'datum', d::date, 'aantal', coalesce(c.n, 0)
        ) order by d), '[]'::jsonb)
      from generate_series(
        (current_date - interval '29 days')::date, current_date, interval '1 day'
      ) d
      left join (
        select created_at::date dd, count(*) n
        from public.wachtlijst
        where created_at >= current_date - interval '29 days'
        group by 1
      ) c on c.dd = d::date
    ),
    'aanmeldingen', jsonb_build_object(
      'totaal',      (select count(*) from public.aanmeldingen),
      'nieuw',       (select count(*) from public.aanmeldingen where status = 'nieuw'),
      'goedgekeurd', (select count(*) from public.aanmeldingen where status = 'goedgekeurd'),
      'afgewezen',   (select count(*) from public.aanmeldingen where status = 'afgewezen')
    ),
    'sterren', jsonb_build_object(
      'actief', (select count(*) from public.stars where status = 'actief'),
      'totaal', (select count(*) from public.stars)
    ),
    'missies', jsonb_build_object(
      'open',   (select count(*) from public.missies where status = 'open'),
      'totaal', (select count(*) from public.missies)
    ),
    'opdrachtgevers', jsonb_build_object(
      'totaal',            (select count(*) from public.opdrachtgevers),
      'membership_actief', (select count(*) from public.opdrachtgevers where membership_status = 'actief'),
      'membership_trial',  (select count(*) from public.opdrachtgevers where membership_status = 'trial')
    )
  ) end;
$$;
revoke all on function public.dashboard_stats() from public;
grant execute on function public.dashboard_stats() to authenticated;

-- ============================================================
-- 20250612120042_founding_cap.sql
-- ============================================================
-- Founding-fase: de eerste 100 designers melden zich direct aan (volledige
-- aanmelding + vouch-flow) en belanden meteen bij de admin-aanmeldingen.
-- Een plek is bezet zolang een aanmelding niet is afgewezen; afwijzen maakt 'm
-- weer vrij. Zodra 100 bezet zijn, sluit het aanmelden vanzelf.

-- Publieke status voor de counter op de site (ook vóór inloggen).
create or replace function public.founding_status()
returns jsonb language sql security definer set search_path = public stable as $$
  with b as (select count(*) n from public.aanmeldingen where status <> 'afgewezen')
  select jsonb_build_object(
    'limiet', 100,
    'bezet', (select n from b),
    'resterend', greatest(0, 100 - (select n from b)),
    'open', (select n from b) < 100
  );
$$;
revoke all on function public.founding_status() from public;
grant execute on function public.founding_status() to anon, authenticated;

-- Indienen (publiek) — nu met founding-cap. Serialiseren via een advisory lock
-- zodat gelijktijdige aanmeldingen nooit samen over de 100 heen gaan.
create or replace function public.dien_aanmelding_in(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token  text := payload ->> 'token';
  v_invite public.uitnodigingen;
  v_id     uuid;
begin
  perform pg_advisory_xact_lock(4210);

  if (select count(*) from public.aanmeldingen where status <> 'afgewezen') >= 100 then
    raise exception 'De eerste 100 founding-plekken zijn vol';
  end if;

  if v_token is not null and v_token <> '' then
    select * into v_invite from public.uitnodigingen
    where token = v_token and status = 'open' for update;
    if v_invite.id is null then
      raise exception 'Uitnodiging ongeldig of al gebruikt';
    end if;
    update public.uitnodigingen set status = 'gebruikt', gebruikt_op = now()
    where id = v_invite.id;
  end if;

  insert into public.aanmeldingen (
    uitnodiging_id, naam, email, rol, seniority,
    portfolio_url, portfolio_bestand, cv_bestand, motivatie
  ) values (
    v_invite.id,
    payload ->> 'naam',
    lower(payload ->> 'email'),
    payload ->> 'rol',
    payload ->> 'seniority',
    nullif(payload ->> 'portfolio_url', ''),
    nullif(payload ->> 'portfolio_bestand', ''),
    nullif(payload ->> 'cv_bestand', ''),
    nullif(payload ->> 'motivatie', '')
  ) returning id into v_id;

  return v_id;
end;
$$;
revoke all on function public.dien_aanmelding_in(jsonb) from public;
grant execute on function public.dien_aanmelding_in(jsonb) to anon, authenticated;


-- ===== 20250612120043_aanmelding_email_check.sql =====
-- Aanmelding indienen: controleer het e-mailadres vóóraf, zodat een kandidaat
-- direct hoort dat hij al een ster-account heeft (of al een aanmelding open
-- heeft staan) in plaats van pas bij goedkeuring door de admin.
create or replace function public.dien_aanmelding_in(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token  text := payload ->> 'token';
  v_email  text := lower(trim(payload ->> 'email'));
  v_invite public.uitnodigingen;
  v_id     uuid;
begin
  perform pg_advisory_xact_lock(4210);

  -- Basiscontrole e-mail (de voorkant valideert ook, maar de DB is de waarheid)
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Vul een geldig e-mailadres in';
  end if;

  -- Al een ster? Dan hoort inloggen, niet opnieuw aanmelden.
  if exists (select 1 from public.stars where lower(email) = v_email) then
    raise exception 'AL_STER';
  end if;

  -- Al een openstaande aanmelding met dit adres?
  if exists (
    select 1 from public.aanmeldingen
    where lower(email) = v_email and status = 'nieuw'
  ) then
    raise exception 'AL_AANGEMELD';
  end if;

  if (select count(*) from public.aanmeldingen where status <> 'afgewezen') >= 100 then
    raise exception 'De eerste 100 founding-plekken zijn vol';
  end if;

  if v_token is not null and v_token <> '' then
    select * into v_invite from public.uitnodigingen
    where token = v_token and status = 'open' for update;
    if v_invite.id is null then
      raise exception 'Uitnodiging ongeldig of al gebruikt';
    end if;
    update public.uitnodigingen set status = 'gebruikt', gebruikt_op = now()
    where id = v_invite.id;
  end if;

  insert into public.aanmeldingen (
    uitnodiging_id, naam, email, rol, seniority,
    portfolio_url, portfolio_bestand, cv_bestand, motivatie
  ) values (
    v_invite.id,
    payload ->> 'naam',
    v_email,
    payload ->> 'rol',
    payload ->> 'seniority',
    nullif(payload ->> 'portfolio_url', ''),
    nullif(payload ->> 'portfolio_bestand', ''),
    nullif(payload ->> 'cv_bestand', ''),
    nullif(payload ->> 'motivatie', '')
  ) returning id into v_id;

  return v_id;
end;
$$;
revoke all on function public.dien_aanmelding_in(jsonb) from public;
grant execute on function public.dien_aanmelding_in(jsonb) to anon, authenticated;

-- ===== 20250612120044_aanbrengbeloning.sql =====
-- Aanbrengbeloning: een ster die een betalende opdrachtgever binnenbrengt krijgt
-- een vaste beloning (bedrag staat in de app, lib/aanbrengen.ts) en een extra
-- vouch. Alles automatisch: koppeling via aanbrenglink (?via=code) of via het
-- e-mailadres van een eerder opgegeven lead; beloning bij de eerste betaalde
-- Stripe-factuur (webhook). Alleen het uitbetalen zelf is handwerk (admin).

-- ── 1. Aanbrengcode per ster (UXS-XXXX, los van de vouch-code) ─────────────
alter table public.stars add column if not exists aanbreng_code text unique;

create or replace function public.genereer_aanbreng_code()
returns text
language plpgsql
as $$
declare
  v_tekens constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code   text;
  v_i      int;
begin
  loop
    v_code := 'UXS-';
    for v_i in 1..4 loop
      v_code := v_code || substr(v_tekens, 1 + floor(random() * length(v_tekens))::int, 1);
    end loop;
    exit when not exists (select 1 from public.stars where aanbreng_code = v_code);
  end loop;
  return v_code;
end;
$$;

update public.stars set aanbreng_code = public.genereer_aanbreng_code() where aanbreng_code is null;
alter table public.stars alter column aanbreng_code set default public.genereer_aanbreng_code();

-- ── 2. Aanbrenger op het bedrijf, koppeling op de lead ──────────────────────
alter table public.opdrachtgevers
  add column if not exists aangebracht_door uuid references public.stars (id) on delete set null;

alter table public.bedrijf_leads
  add column if not exists bedrijf_id uuid references public.opdrachtgevers (id) on delete set null;

alter table public.bedrijf_leads drop constraint if exists bedrijf_leads_status_check;
alter table public.bedrijf_leads
  add constraint bedrijf_leads_status_check
  check (status in ('nieuw', 'benaderd', 'binnen', 'betalend', 'afgewezen'));

-- ── 3. Beloningen ───────────────────────────────────────────────────────────
create table if not exists public.beloningen (
  id            uuid primary key default gen_random_uuid(),
  ster_id       uuid not null references public.stars (id) on delete cascade,
  bedrijf_id    uuid not null references public.opdrachtgevers (id) on delete cascade,
  bedrag_cent   int  not null,
  kenmerk       text not null unique,
  status        text not null default 'open' check (status in ('open', 'uitbetaald')),
  created_at    timestamptz not null default now(),
  uitbetaald_op timestamptz,
  unique (bedrijf_id)          -- één beloning per bedrijf, ooit
);
alter table public.beloningen enable row level security;
-- Geen directe policies: alles via functies.

-- ── 4. Ster: eigen aanbrengcode ─────────────────────────────────────────────
create or replace function public.mijn_aanbreng_code()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select aanbreng_code from public.stars where user_id = auth.uid() limit 1;
$$;
revoke all on function public.mijn_aanbreng_code() from public;
grant execute on function public.mijn_aanbreng_code() to authenticated;

-- ── 5. Bedrijf aanmaken mét aanbrenger (link of lead-e-mail) ────────────────
create or replace function public.maak_bedrijf(p_naam text, p_aanbreng_code text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_id    uuid;
  v_ster  uuid;
  v_lead  public.bedrijf_leads;
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd';
  end if;

  select id into v_id from public.opdrachtgevers where user_id = auth.uid();
  if v_id is not null then
    return v_id;
  end if;

  -- Aanbrenger: eerst via code uit de link, anders via een lead met dit e-mailadres.
  if coalesce(p_aanbreng_code, '') <> '' then
    select id into v_ster from public.stars where aanbreng_code = upper(trim(p_aanbreng_code));
  end if;
  if v_ster is null and v_email <> '' then
    select * into v_lead from public.bedrijf_leads
    where lower(contact_email) = v_email and status in ('nieuw', 'benaderd')
    order by created_at desc limit 1;
    v_ster := v_lead.ster_id;
  end if;

  insert into public.opdrachtgevers (naam, email, user_id, aangebracht_door)
  values (coalesce(nullif(p_naam, ''), 'Mijn bedrijf'), v_email, auth.uid(), v_ster)
  returning id into v_id;

  -- Lead(s) van deze aanbrenger voor dit adres: binnen.
  if v_ster is not null then
    update public.bedrijf_leads
    set status = 'binnen', bedrijf_id = v_id
    where ster_id = v_ster
      and (lower(contact_email) = v_email or (v_lead.id is not null and id = v_lead.id))
      and status in ('nieuw', 'benaderd');
  end if;

  return v_id;
end;
$$;
revoke all on function public.maak_bedrijf(text, text) from public;
grant execute on function public.maak_bedrijf(text, text) to authenticated;
drop function if exists public.maak_bedrijf(text);

-- ── 6. Beloning registreren (webhook, service-role) ─────────────────────────
-- Idempotent: tweede aanroep voor hetzelfde bedrijf geeft nieuw=false.
create or replace function public.registreer_beloning(p_bedrijf_id uuid, p_bedrag_cent int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bedrijf public.opdrachtgevers;
  v_ster    public.stars;
  v_kenmerk text;
  v_id      uuid;
begin
  select * into v_bedrijf from public.opdrachtgevers where id = p_bedrijf_id;
  if v_bedrijf.id is null or v_bedrijf.aangebracht_door is null then
    return jsonb_build_object('nieuw', false, 'reden', 'geen aanbrenger');
  end if;
  if exists (select 1 from public.beloningen where bedrijf_id = p_bedrijf_id) then
    return jsonb_build_object('nieuw', false, 'reden', 'al beloond');
  end if;

  select * into v_ster from public.stars where id = v_bedrijf.aangebracht_door;
  v_kenmerk := 'UXS-B-' || to_char(now(), 'YYMM') || '-' || upper(substr(md5(p_bedrijf_id::text), 1, 4));

  insert into public.beloningen (ster_id, bedrijf_id, bedrag_cent, kenmerk)
  values (v_ster.id, p_bedrijf_id, p_bedrag_cent, v_kenmerk)
  returning id into v_id;

  -- Extra vouch voor de aanbrenger.
  insert into public.uitnodigingen (token, uitgever_star_id)
  values (gen_random_uuid()::text, v_ster.id);

  update public.bedrijf_leads set status = 'betalend'
  where bedrijf_id = p_bedrijf_id or (ster_id = v_ster.id and lower(contact_email) = lower(v_bedrijf.email) and status = 'binnen');

  return jsonb_build_object(
    'nieuw', true, 'id', v_id, 'kenmerk', v_kenmerk,
    'ster_id', v_ster.id, 'ster_naam', v_ster.naam, 'ster_email', v_ster.email,
    'bedrijf_naam', v_bedrijf.naam
  );
end;
$$;
revoke all on function public.registreer_beloning(uuid, int) from public;
grant execute on function public.registreer_beloning(uuid, int) to service_role;

-- ── 7. Ster: eigen aanbevelingen incl. beloningsstatus ──────────────────────
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
        'status', case when b.status = 'uitbetaald' then 'uitbetaald' else l.status end,
        'created_at', l.created_at
      ) order by l.created_at desc
    ), '[]'::jsonb
  )
  from public.bedrijf_leads l
  join public.stars s on s.id = l.ster_id
  left join public.beloningen b on b.bedrijf_id = l.bedrijf_id and b.ster_id = l.ster_id
  where s.user_id = auth.uid();
$$;

-- ── 8. Admin: beloningen bekijken en uitbetalen ─────────────────────────────
create or replace function public.admin_beloningen()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', b.id, 'kenmerk', b.kenmerk, 'bedrag_cent', b.bedrag_cent, 'status', b.status,
        'ster_naam', s.naam, 'ster_email', s.email, 'bedrijf_naam', o.naam,
        'created_at', b.created_at, 'uitbetaald_op', b.uitbetaald_op
      ) order by b.status desc, b.created_at desc
    ), '[]'::jsonb
  )
  from public.beloningen b
  join public.stars s on s.id = b.ster_id
  join public.opdrachtgevers o on o.id = b.bedrijf_id
  where public.is_admin();
$$;
revoke all on function public.admin_beloningen() from public;
grant execute on function public.admin_beloningen() to authenticated;

create or replace function public.markeer_beloning_uitbetaald(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Geen toegang'; end if;
  update public.beloningen set status = 'uitbetaald', uitbetaald_op = now()
  where id = p_id and status = 'open';
end;
$$;
revoke all on function public.markeer_beloning_uitbetaald(uuid) from public;
grant execute on function public.markeer_beloning_uitbetaald(uuid) to authenticated;

-- ── 9. Eigen vouch: eerst een open uitnodiging tonen (extra vouch) ─────────
create or replace function public.mijn_uitnodiging()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object('token', u.token, 'code', u.code, 'status', u.status)
  from public.uitnodigingen u
  join public.stars s on s.id = u.uitgever_star_id
  where s.user_id = auth.uid()
  order by (u.status = 'open') desc, u.created_at desc
  limit 1;
$$;

-- ===== 20250612120045_aanbevelingen_via_link.sql =====
-- Aanbevelingen van een ster: niet alleen de leads uit het formulier, maar ook
-- bedrijven die via de aanbrenglink binnenkwamen zonder lead. Status wordt
-- afgeleid uit het bedrijf zelf (proefperiode, betalend, beloning uitbetaald),
-- zodat de ster altijd ziet hoe zijn aanbeveling ervoor staat.
create or replace function public.mijn_aanbevelingen()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with ster as (
    select id from public.stars where user_id = auth.uid() limit 1
  ),
  -- Bedrijven die aan deze ster gekoppeld zijn (via link of lead-e-mail)
  bedrijven as (
    select
      o.id                    as bedrijf_id,
      o.naam                  as bedrijf_naam,
      o.created_at,
      case
        when b.status = 'uitbetaald'          then 'uitbetaald'
        when b.id is not null                 then 'betalend'
        when o.membership_status = 'actief'   then 'betalend'
        when o.membership_status = 'trial'    then 'proefperiode'
        else 'binnen'
      end as status
    from public.opdrachtgevers o
    left join public.beloningen b on b.bedrijf_id = o.id
    where o.aangebracht_door = (select id from ster)
  ),
  -- Leads uit het formulier die (nog) niet aan een bedrijf gekoppeld zijn
  losse_leads as (
    select
      l.id, l.bedrijf_naam, l.created_at, l.status
    from public.bedrijf_leads l
    where l.ster_id = (select id from ster)
      and (l.bedrijf_id is null or not exists (select 1 from bedrijven bv where bv.bedrijf_id = l.bedrijf_id))
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', id, 'bedrijf_naam', bedrijf_naam, 'status', status, 'created_at', created_at)
      order by created_at desc
    ), '[]'::jsonb
  )
  from (
    select bedrijf_id as id, bedrijf_naam, created_at, status from bedrijven
    union all
    select id, bedrijf_naam, created_at, status from losse_leads
  ) x;
$$;

-- ===== 20250612120046_plaatsing_vereist_membership.sql =====
-- Een ster voorstellen of een plaatsing bevestigen kan alleen als het bedrijf
-- een betalend (actief) membership heeft. In de proefperiode mag een bedrijf
-- een missie plaatsen en reacties bekijken; de match zelf zit achter de
-- betaling. Missies zonder bedrijfsaccount (publiek formulier) vallen hier
-- buiten; die regelt UXSTARS handmatig.
create or replace function public.controleer_membership_voor_reactie(p_reactie_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_status text;
begin
  select o.membership_status into v_status
  from public.reacties r
  join public.missies m on m.id = r.missie_id
  join public.opdrachtgevers o on o.id = m.opdrachtgever_id
  where r.id = p_reactie_id;

  if v_status is not null and v_status <> 'actief' then
    raise exception 'MEMBERSHIP_VEREIST';
  end if;
end;
$$;

create or replace function public.markeer_voorgesteld(p_reactie_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  perform public.controleer_membership_voor_reactie(p_reactie_id);
  update public.reacties set status = 'uitgenodigd' where id = p_reactie_id;
end;
$$;

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
  perform public.controleer_membership_voor_reactie(p_reactie_id);

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
