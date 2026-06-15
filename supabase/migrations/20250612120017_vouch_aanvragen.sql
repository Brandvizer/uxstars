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
