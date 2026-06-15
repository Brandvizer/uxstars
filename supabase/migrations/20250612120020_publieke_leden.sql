-- Fase 1E — Community zichtbaar: publieke ledenlijst met vouch-afkomst.
--
-- Toont de actieve sterren met wie hen vouchte ("gevouched door X") en hoeveel
-- vouches ze zelf gaven. Toestemmings-bewust voor de foto (zoals publieke_sterren).

create or replace function public.publieke_leden()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'naam', s.naam,
        'specialisme', s.specialisme,
        'seniority', s.seniority,
        'beschikbaar', s.beschikbaar,
        'bio', s.bio,
        'foto_url', case when s.foto_toestemming then s.foto_url else null end,
        'gevouched_door', (
          select vs.naam
          from public.vouches v
          join public.stars vs on vs.id = v.van_star_id
          where v.naar_star_id = s.id
          order by v.created_at asc
          limit 1
        ),
        'aantal_vouches_gegeven', (
          select count(*) from public.vouches v2 where v2.van_star_id = s.id
        )
      )
      order by s.created_at asc
    ),
    '[]'::jsonb
  )
  from public.stars s
  where s.status = 'actief';
$$;

revoke all on function public.publieke_leden() from public;
grant execute on function public.publieke_leden() to anon, authenticated;
