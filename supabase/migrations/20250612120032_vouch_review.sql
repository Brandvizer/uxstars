-- Admin-review op de member-vouch flow. Wie een vouch inwisselt wordt niet meer
-- direct actief, maar 'gevouched' (in afwachting). Admin keurt goed (→ actief +
-- eigen vouch) of wijst af (→ afgewezen, met motivatie-mail vanuit de app-laag).

-- 1. Status 'afgewezen' toestaan op stars ('gevouched' bestond al = pending).
alter table public.stars drop constraint if exists stars_status_check;
alter table public.stars
  add constraint stars_status_check
  check (status in ('aangevraagd', 'gevouched', 'actief', 'gepauzeerd', 'afgewezen'));

-- 2. Inwisselen maakt nu een PENDING ster (status 'gevouched'); de eigen vouch en
--    de vouch-lijn volgen pas bij goedkeuring.
create or replace function public.gebruik_uitnodiging(
  p_token       text,
  p_naam        text,
  p_specialisme text,
  p_seniority   text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite   public.uitnodigingen;
  v_email    text := auth.jwt() ->> 'email';
  v_star_id  uuid;
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd';
  end if;

  if exists (select 1 from public.stars where user_id = auth.uid()) then
    raise exception 'Je hebt al een ster-account';
  end if;

  select * into v_invite
  from public.uitnodigingen
  where token = p_token and status = 'open'
  for update;

  if v_invite.id is null then
    raise exception 'Uitnodiging ongeldig of al gebruikt';
  end if;

  begin
    insert into public.stars (naam, specialisme, seniority, beschikbaar, status, email, user_id)
    values (p_naam, p_specialisme, p_seniority, false, 'gevouched', v_email, auth.uid())
    returning id into v_star_id;
  exception when unique_violation then
    raise exception 'Je hebt al een ster-account';
  end;

  -- Uitnodiging als gebruikt markeren (zodat 'ie niet nog eens kan).
  update public.uitnodigingen
  set status = 'gebruikt', gebruikt_door_star_id = v_star_id, gebruikt_op = now()
  where id = v_invite.id;

  return v_star_id;
end;
$$;

revoke all on function public.gebruik_uitnodiging(text, text, text, text) from public;
grant execute on function public.gebruik_uitnodiging(text, text, text, text) to authenticated;

-- 3. uitnodiging_info levert nu ook de code (voor de kraskaart bij de ontvanger).
create or replace function public.uitnodiging_info(p_token text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'geldig', u.id is not null,
    'uitnodiger', s.naam,
    'code', u.code
  )
  from public.uitnodigingen u
  left join public.stars s on s.id = u.uitgever_star_id
  where u.token = p_token and u.status = 'open'
  union all
  select jsonb_build_object('geldig', false, 'uitnodiger', null, 'code', null)
  where not exists (
    select 1 from public.uitnodigingen where token = p_token and status = 'open'
  )
  limit 1;
$$;

-- 4. Admin: wachtende aanmeldingen (gevouchte, nog niet goedgekeurde sterren).
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

-- 5. Admin: goedkeuren → actief + vouch-lijn + eigen vouch. Geeft e-mail + naam terug.
create or replace function public.keur_ster_goed(p_star_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_star     public.stars;
  v_uitgever uuid;
begin
  if not public.is_admin() then
    raise exception 'Alleen beheerders';
  end if;

  select * into v_star from public.stars where id = p_star_id and status = 'gevouched';
  if v_star.id is null then
    raise exception 'Geen wachtende aanmelding';
  end if;

  update public.stars set status = 'actief', updated_at = now() where id = p_star_id;

  -- Vouch-lijn van de uitnodiger naar deze ster.
  select uitgever_star_id into v_uitgever
  from public.uitnodigingen where gebruikt_door_star_id = p_star_id limit 1;
  if v_uitgever is not null then
    insert into public.vouches (van_star_id, naar_star_id)
    values (v_uitgever, p_star_id) on conflict do nothing;
  end if;

  -- Deze ster krijgt nu zelf één vouch om weg te geven (als die er nog niet is).
  if not exists (select 1 from public.uitnodigingen where uitgever_star_id = p_star_id) then
    insert into public.uitnodigingen (token, uitgever_star_id)
    values (gen_random_uuid()::text, p_star_id);
  end if;

  return jsonb_build_object('email', v_star.email, 'naam', v_star.naam);
end;
$$;

revoke all on function public.keur_ster_goed(uuid) from public;
grant execute on function public.keur_ster_goed(uuid) to authenticated;

-- 6. Admin: afwijzen → status 'afgewezen'. Geeft e-mail + naam terug (mail volgt uit app).
create or replace function public.wijs_ster_af(p_star_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_star public.stars;
begin
  if not public.is_admin() then
    raise exception 'Alleen beheerders';
  end if;

  select * into v_star from public.stars where id = p_star_id and status = 'gevouched';
  if v_star.id is null then
    raise exception 'Geen wachtende aanmelding';
  end if;

  update public.stars set status = 'afgewezen', updated_at = now() where id = p_star_id;

  return jsonb_build_object('email', v_star.email, 'naam', v_star.naam);
end;
$$;

revoke all on function public.wijs_ster_af(uuid) from public;
grant execute on function public.wijs_ster_af(uuid) to authenticated;
