-- Aanmelding indienen: controleer het e-mailadres vóóraf, zodat een kandidaat
-- direct hoort dat hij al een ster-account heeft (of al een aanmelding open
-- heeft staan) in plaats van pas bij goedkeuring door de admin.
create or replace function public.dien_aanmelding_in(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token  text := payload ->> 'token';
  v_email  text := lower(trim(payload ->> 'email'));
  v_invite public.uitnodigingen;
  v_id     uuid;
begin
  perform pg_advisory_xact_lock(4210);

  -- Basiscontrole e-mail (de voorkant valideert ook, maar de DB is de waarheid)
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Vul een geldig e-mailadres in';
  end if;

  -- Al een ster? Dan hoort inloggen, niet opnieuw aanmelden.
  if exists (select 1 from public.stars where lower(email) = v_email) then
    raise exception 'AL_STER';
  end if;

  -- Al een openstaande aanmelding met dit adres?
  if exists (
    select 1 from public.aanmeldingen
    where lower(email) = v_email and status = 'nieuw'
  ) then
    raise exception 'AL_AANGEMELD';
  end if;

  if (select count(*) from public.aanmeldingen where status <> 'afgewezen') >= 100 then
    raise exception 'De eerste 100 founding-plekken zijn vol';
  end if;

  if v_token is not null and v_token <> '' then
    select * into v_invite from public.uitnodigingen
    where token = v_token and status = 'open' for update;
    if v_invite.id is null then
      raise exception 'Uitnodiging ongeldig of al gebruikt';
    end if;
    update public.uitnodigingen set status = 'gebruikt', gebruikt_op = now()
    where id = v_invite.id;
  end if;

  insert into public.aanmeldingen (
    uitnodiging_id, naam, email, rol, seniority,
    portfolio_url, portfolio_bestand, cv_bestand, motivatie
  ) values (
    v_invite.id,
    payload ->> 'naam',
    v_email,
    payload ->> 'rol',
    payload ->> 'seniority',
    nullif(payload ->> 'portfolio_url', ''),
    nullif(payload ->> 'portfolio_bestand', ''),
    nullif(payload ->> 'cv_bestand', ''),
    nullif(payload ->> 'motivatie', '')
  ) returning id into v_id;

  return v_id;
end;
$$;
revoke all on function public.dien_aanmelding_in(jsonb) from public;
grant execute on function public.dien_aanmelding_in(jsonb) to anon, authenticated;
