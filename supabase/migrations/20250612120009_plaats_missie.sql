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
