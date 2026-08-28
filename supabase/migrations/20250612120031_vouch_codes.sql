-- Vouch-codes: elke uitnodiging krijgt een korte, typbare code (STAR-XXXX) naast
-- de UUID-token. De ontvanger kan de code invullen (met live check) of de link
-- gebruiken. De kraskaart op /account onthult de code.

-- 1. Code-generator: korte, ondubbelzinnige code (geen 0/O/1/I/L), uniek.
create or replace function public.genereer_vouch_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alfabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code    text;
  i         int;
begin
  loop
    v_code := 'STAR-';
    for i in 1..4 loop
      v_code := v_code || substr(v_alfabet, 1 + floor(random() * length(v_alfabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.uitnodigingen where code = v_code);
  end loop;
  return v_code;
end;
$$;

-- 2. Kolom + unieke index.
alter table public.uitnodigingen add column if not exists code text;

-- 3. Bestaande uitnodigingen een code geven (per rij, ziet eigen wijzigingen).
do $$
declare r record;
begin
  for r in select id from public.uitnodigingen where code is null loop
    update public.uitnodigingen set code = public.genereer_vouch_code() where id = r.id;
  end loop;
end $$;

-- 4. Nieuwe uitnodigingen krijgen automatisch een code (dekt zowel de
--    bootstrap-invites als de vouch die elke nieuwe ster krijgt).
alter table public.uitnodigingen alter column code set default public.genereer_vouch_code();

create unique index if not exists uitnodigingen_code_key on public.uitnodigingen (code);

-- 5. Mijn eigen uitnodiging levert nu ook de code (voor de kraskaart).
create or replace function public.mijn_uitnodiging()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object('token', u.token, 'code', u.code, 'status', u.status)
  from public.uitnodigingen u
  join public.stars s on s.id = u.uitgever_star_id
  where s.user_id = auth.uid()
  limit 1;
$$;

-- 6. Publieke check: resolve een ingevulde code naar geldigheid + uitnodiger + token.
create or replace function public.uitnodiging_via_code(p_code text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select jsonb_build_object('geldig', true, 'uitnodiger', s.naam, 'token', u.token)
      from public.uitnodigingen u
      left join public.stars s on s.id = u.uitgever_star_id
      where upper(u.code) = upper(trim(p_code)) and u.status = 'open'
      limit 1
    ),
    jsonb_build_object('geldig', false, 'uitnodiger', null, 'token', null)
  );
$$;

revoke all on function public.uitnodiging_via_code(text) from public;
grant execute on function public.uitnodiging_via_code(text) to anon, authenticated;
