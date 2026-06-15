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
