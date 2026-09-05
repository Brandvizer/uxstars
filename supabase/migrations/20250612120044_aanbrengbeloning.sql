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
