-- Aanmeldingen bevatten nu ook portfolio/linkedin/bio, zodat de admin echt kan
-- beoordelen. (De onboarding vult die velden; hier geven we ze terug.)

create or replace function public.admin_wachtende_sterren()
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
        'email', s.email,
        'portfolio_url', s.portfolio_url,
        'linkedin_url', s.linkedin_url,
        'bio', s.bio,
        'uitnodiger', uitg.naam,
        'created_at', s.created_at
      )
      order by s.created_at asc
    ),
    '[]'::jsonb
  )
  from public.stars s
  left join public.uitnodigingen u on u.gebruikt_door_star_id = s.id
  left join public.stars uitg on uitg.id = u.uitgever_star_id
  where public.is_admin() and s.status = 'gevouched';
$$;
