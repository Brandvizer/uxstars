-- Vouch-vangnet: als twee gelijktijdige aanroepen beide voorbij de "al lid?"-
-- check komen, botst de tweede ster-insert op de unieke index (stars_user_id_key).
-- We vangen die op en geven de nette melding i.p.v. een rauwe DB-fout.

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

  -- Al lid?
  if exists (select 1 from public.stars where user_id = auth.uid()) then
    raise exception 'Je hebt al een ster-account';
  end if;

  -- Geldige, openstaande uitnodiging vergrendelen.
  select * into v_invite
  from public.uitnodigingen
  where token = p_token and status = 'open'
  for update;

  if v_invite.id is null then
    raise exception 'Uitnodiging ongeldig of al gebruikt';
  end if;

  -- Nieuwe, direct actieve ster. Vangnet tegen de race: als er tussentijds toch
  -- al een account voor deze gebruiker is aangemaakt, botst de unieke index.
  begin
    insert into public.stars (naam, specialisme, seniority, beschikbaar, status, email, user_id)
    values (p_naam, p_specialisme, p_seniority, false, 'actief', v_email, auth.uid())
    returning id into v_star_id;
  exception when unique_violation then
    raise exception 'Je hebt al een ster-account';
  end;

  -- Vouch-lijn van uitnodiger naar nieuwe ster (alleen als er een uitgever is).
  if v_invite.uitgever_star_id is not null then
    insert into public.vouches (van_star_id, naar_star_id)
    values (v_invite.uitgever_star_id, v_star_id)
    on conflict do nothing;
  end if;

  -- Uitnodiging als gebruikt markeren.
  update public.uitnodigingen
  set status = 'gebruikt', gebruikt_door_star_id = v_star_id, gebruikt_op = now()
  where id = v_invite.id;

  -- De nieuwe ster krijgt zelf één vouch om weg te geven.
  insert into public.uitnodigingen (token, uitgever_star_id)
  values (gen_random_uuid()::text, v_star_id);

  return v_star_id;
end;
$$;

revoke all on function public.gebruik_uitnodiging(text, text, text, text) from public;
grant execute on function public.gebruik_uitnodiging(text, text, text, text) to authenticated;
