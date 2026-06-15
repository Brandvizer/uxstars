-- Admin-kant van de reacties: bekijken, ster voorstellen, plaatsing bevestigen.

-- Alle reacties met ster- en missiedetails (alleen voor beheerders).
create or replace function public.admin_reacties()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'reactie_id', r.id,
        'status', r.status,
        'motivatie', r.motivatie,
        'created_at', r.created_at,
        'missie_id', m.id,
        'missie_titel', m.titel,
        'missie_status', m.status,
        'opdrachtgever_label', m.opdrachtgever_label,
        'opdrachtgever_email', o.email,
        'star', jsonb_build_object(
          'naam', s.naam,
          'specialisme', s.specialisme,
          'seniority', s.seniority,
          'email', s.email,
          'portfolio_url', s.portfolio_url,
          'linkedin_url', s.linkedin_url
        )
      ) order by r.created_at desc
    ),
    '[]'::jsonb
  )
  from public.reacties r
  join public.missies m on m.id = r.missie_id
  left join public.stars s on s.id = r.star_id
  left join public.opdrachtgevers o on o.id = m.opdrachtgever_id
  where public.is_admin();
$$;

revoke all on function public.admin_reacties() from public;
grant execute on function public.admin_reacties() to authenticated;

-- Markeer dat een ster is voorgesteld aan de opdrachtgever (de mail zelf
-- verstuurt de app via Resend).
create or replace function public.markeer_voorgesteld(p_reactie_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  update public.reacties set status = 'uitgenodigd' where id = p_reactie_id;
end;
$$;

revoke all on function public.markeer_voorgesteld(uuid) from public;
grant execute on function public.markeer_voorgesteld(uuid) to authenticated;

-- Bevestig een plaatsing: maak plaatsing aan, zet de missie op 'gevuld'.
create or replace function public.bevestig_plaatsing(p_reactie_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_missie uuid;
  v_star   uuid;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;

  select missie_id, star_id into v_missie, v_star
  from public.reacties where id = p_reactie_id;
  if v_missie is null then raise exception 'Reactie niet gevonden'; end if;

  insert into public.plaatsingen (missie_id, star_id, status)
  values (v_missie, v_star, 'actief');

  update public.missies set status = 'gevuld' where id = v_missie;
end;
$$;

revoke all on function public.bevestig_plaatsing(uuid) from public;
grant execute on function public.bevestig_plaatsing(uuid) to authenticated;
