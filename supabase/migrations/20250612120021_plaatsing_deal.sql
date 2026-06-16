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
