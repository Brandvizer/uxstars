-- Bedrijfslogo op de missie (voor de job-board-thumbnails). Gedenormaliseerd,
-- net als opdrachtgever_label: gezet bij het plaatsen.

alter table public.missies add column if not exists opdrachtgever_logo text;

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
    start_indicatie, status, intro, omschrijving, opdrachtgever_id,
    opdrachtgever_label, opdrachtgever_logo
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
    v_bedrijf.naam,
    v_bedrijf.logo_url
  );

  return v_slug;
end;
$$;

revoke all on function public.plaats_missie_als_bedrijf(jsonb) from public;
grant execute on function public.plaats_missie_als_bedrijf(jsonb) to authenticated;

-- Bestaande bedrijfsmissies alvast het logo van hun bedrijf geven.
update public.missies m
set opdrachtgever_logo = o.logo_url
from public.opdrachtgevers o
where m.opdrachtgever_id = o.id
  and m.opdrachtgever_logo is null
  and o.logo_url is not null;
