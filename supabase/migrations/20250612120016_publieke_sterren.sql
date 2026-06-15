-- Publieke sterrenlijst voor het sterrenveld, toestemmings-bewust: foto_url
-- komt alleen mee als de ster toestemming gaf om de foto elders te tonen.
create or replace function public.publieke_sterren()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'naam', naam,
        'specialisme', specialisme,
        'seniority', seniority,
        'beschikbaar', beschikbaar,
        'foto_url', case when foto_toestemming then foto_url else null end
      )
    ),
    '[]'::jsonb
  )
  from public.stars
  where status = 'actief';
$$;

revoke all on function public.publieke_sterren() from public;
grant execute on function public.publieke_sterren() to anon, authenticated;
