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
