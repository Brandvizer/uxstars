-- Bedrijf kan eigen missies bewerken. mijn_missies geeft nu alle velden terug
-- (nodig om het bewerk-formulier voor te vullen), en werk_missie_bij werkt een
-- eigen missie bij zolang die nog niet gevuld/gearchiveerd is.

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
