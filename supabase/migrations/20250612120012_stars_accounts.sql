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
