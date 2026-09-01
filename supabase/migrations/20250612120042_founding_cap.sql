-- Founding-fase: de eerste 100 designers melden zich direct aan (volledige
-- aanmelding + vouch-flow) en belanden meteen bij de admin-aanmeldingen.
-- Een plek is bezet zolang een aanmelding niet is afgewezen; afwijzen maakt 'm
-- weer vrij. Zodra 100 bezet zijn, sluit het aanmelden vanzelf.

-- Publieke status voor de counter op de site (ook vóór inloggen).
create or replace function public.founding_status()
returns jsonb language sql security definer set search_path = public stable as $$
  with b as (select count(*) n from public.aanmeldingen where status <> 'afgewezen')
  select jsonb_build_object(
    'limiet', 100,
    'bezet', (select n from b),
    'resterend', greatest(0, 100 - (select n from b)),
    'open', (select n from b) < 100
  );
$$;
revoke all on function public.founding_status() from public;
grant execute on function public.founding_status() to anon, authenticated;

-- Indienen (publiek) — nu met founding-cap. Serialiseren via een advisory lock
-- zodat gelijktijdige aanmeldingen nooit samen over de 100 heen gaan.
create or replace function public.dien_aanmelding_in(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token  text := payload ->> 'token';
  v_invite public.uitnodigingen;
  v_id     uuid;
begin
  perform pg_advisory_xact_lock(4210);

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
    lower(payload ->> 'email'),
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
