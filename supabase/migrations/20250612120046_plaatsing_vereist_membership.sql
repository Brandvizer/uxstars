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

-- Voor de admin-UI: vooraf checken (en het bedrijf erbij) zodat we een nette
-- melding kunnen tonen en het bedrijf kunnen mailen, vóór we mails naar de
-- ster of opdrachtgever sturen.
create or replace function public.membership_voor_reactie(p_reactie_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select case
    when not public.is_admin() then null
    else jsonb_build_object(
      'bedrijf_id', o.id,
      'bedrijf_naam', o.naam,
      'bedrijf_email', o.email,
      'membership_status', o.membership_status,
      'ok', (o.id is null or o.membership_status = 'actief')
    )
  end
  from public.reacties r
  join public.missies m on m.id = r.missie_id
  left join public.opdrachtgevers o on o.id = m.opdrachtgever_id
  where r.id = p_reactie_id;
$$;
revoke all on function public.membership_voor_reactie(uuid) from public;
grant execute on function public.membership_voor_reactie(uuid) to authenticated;
