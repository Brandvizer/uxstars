-- Gamification — "Jouw tak van het stelsel".
--
-- Voor de ingelogde ster: wie vouchte jou, wie vouchte jij direct, en hoeveel
-- sterren stammen er in totaal van jou af (recursief). Beloont de vouch-moat.

create or replace function public.mijn_stelsel()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_star uuid;
begin
  select id into v_star from public.stars where user_id = auth.uid();
  if v_star is null then
    return jsonb_build_object('gevouched_door', null, 'directe', '[]'::jsonb, 'aantal_afstammelingen', 0);
  end if;

  return jsonb_build_object(
    'gevouched_door', (
      select vs.naam
      from public.vouches v
      join public.stars vs on vs.id = v.van_star_id
      where v.naar_star_id = v_star
      order by v.created_at asc
      limit 1
    ),
    'directe', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'naam', s.naam,
            'specialisme', s.specialisme,
            'beschikbaar', s.beschikbaar,
            'foto_url', case when s.foto_toestemming then s.foto_url else null end
          )
          order by v.created_at asc
        ),
        '[]'::jsonb
      )
      from public.vouches v
      join public.stars s on s.id = v.naar_star_id
      where v.van_star_id = v_star
    ),
    'aantal_afstammelingen', (
      with recursive boom as (
        select naar_star_id as id from public.vouches where van_star_id = v_star
        union
        select v.naar_star_id from public.vouches v join boom b on v.van_star_id = b.id
      )
      select count(*) from boom
    )
  );
end;
$$;

revoke all on function public.mijn_stelsel() from public;
grant execute on function public.mijn_stelsel() to authenticated;
