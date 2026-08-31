-- Nieuwe, account-loze aanmeld-flow. Je solliciteert eerst (aanmelding), pas na
-- goedkeuring wordt je account + ster aangemaakt. Vervangt de "account vóór
-- goedkeuring"-aanpak.

create table if not exists public.aanmeldingen (
  id                 uuid primary key default gen_random_uuid(),
  uitnodiging_id     uuid references public.uitnodigingen (id) on delete set null,
  naam               text not null,
  email              text not null,
  rol                text not null,
  seniority          text not null,
  portfolio_url      text,
  portfolio_bestand  text,
  cv_bestand         text,
  motivatie          text,
  status             text not null default 'nieuw'
                     check (status in ('nieuw', 'goedgekeurd', 'afgewezen')),
  ster_id            uuid references public.stars (id) on delete set null,
  created_at         timestamptz not null default now()
);

alter table public.aanmeldingen enable row level security;
-- Geen directe policies: alles loopt via de functies hieronder.

-- Indienen (publiek). Bij een netwerk-vouch moet de token geldig+open zijn; die
-- wordt meteen als gebruikt gemarkeerd zodat 'ie niet nogmaals kan.
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

-- Admin: openstaande aanmeldingen met alle beoordelingsgegevens.
create or replace function public.admin_aanmeldingen()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'naam', a.naam, 'email', a.email, 'rol', a.rol,
      'seniority', a.seniority, 'portfolio_url', a.portfolio_url,
      'portfolio_bestand', a.portfolio_bestand, 'cv_bestand', a.cv_bestand,
      'motivatie', a.motivatie, 'uitnodiger', s.naam, 'created_at', a.created_at
    ) order by a.created_at asc), '[]'::jsonb)
  from public.aanmeldingen a
  left join public.uitnodigingen u on u.id = a.uitnodiging_id
  left join public.stars s on s.id = u.uitgever_star_id
  where public.is_admin() and a.status = 'nieuw';
$$;

revoke all on function public.admin_aanmeldingen() from public;
grant execute on function public.admin_aanmeldingen() to authenticated;

-- Admin: goedkeuren → maak een actieve ster uit de aanmelding (user_id komt uit
-- de app-laag, die de auth-user aanmaakt). Reikt de eigen vouch + vouch-lijn uit.
create or replace function public.maak_ster_uit_aanmelding(p_id uuid, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  a         public.aanmeldingen;
  v_star_id uuid;
  v_uitgever uuid;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  select * into a from public.aanmeldingen where id = p_id and status = 'nieuw';
  if a.id is null then raise exception 'Geen openstaande aanmelding'; end if;

  begin
    insert into public.stars (
      naam, specialisme, seniority, beschikbaar, status, email, user_id,
      portfolio_url, bio
    ) values (
      a.naam, a.rol, a.seniority, false, 'actief', a.email, p_user_id,
      a.portfolio_url, a.motivatie
    ) returning id into v_star_id;
  exception when unique_violation then
    raise exception 'Deze kandidaat heeft al een ster-account';
  end;

  select uitgever_star_id into v_uitgever from public.uitnodigingen where id = a.uitnodiging_id;
  if v_uitgever is not null then
    insert into public.vouches (van_star_id, naar_star_id)
    values (v_uitgever, v_star_id) on conflict do nothing;
  end if;

  insert into public.uitnodigingen (token, uitgever_star_id)
  values (gen_random_uuid()::text, v_star_id);

  update public.aanmeldingen set status = 'goedgekeurd', ster_id = v_star_id where id = p_id;

  return jsonb_build_object('email', a.email, 'naam', a.naam, 'star_id', v_star_id);
end;
$$;

revoke all on function public.maak_ster_uit_aanmelding(uuid, uuid) from public;
grant execute on function public.maak_ster_uit_aanmelding(uuid, uuid) to authenticated;

-- Admin: afwijzen.
create or replace function public.wijs_aanmelding_af(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare a public.aanmeldingen;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  select * into a from public.aanmeldingen where id = p_id and status = 'nieuw';
  if a.id is null then raise exception 'Geen openstaande aanmelding'; end if;
  update public.aanmeldingen set status = 'afgewezen' where id = p_id;
  return jsonb_build_object('email', a.email, 'naam', a.naam);
end;
$$;

revoke all on function public.wijs_aanmelding_af(uuid) from public;
grant execute on function public.wijs_aanmelding_af(uuid) to authenticated;

-- Opslag voor CV/portfolio-bestanden. Publieke bucket (unguessbare paden),
-- anon mag uploaden (de aanmelder is nog niet ingelogd).
insert into storage.buckets (id, name, public)
values ('aanmeldingen', 'aanmeldingen', true)
on conflict (id) do nothing;

drop policy if exists "aanmelding upload" on storage.objects;
create policy "aanmelding upload" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'aanmeldingen');

drop policy if exists "aanmelding read" on storage.objects;
create policy "aanmelding read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'aanmeldingen');
