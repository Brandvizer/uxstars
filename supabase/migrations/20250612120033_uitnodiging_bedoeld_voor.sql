-- Onthoud voor welk e-mailadres een vouch bedoeld is (ingevuld door de uitnodiger),
-- zodat we het op de aanmeld-stap kunnen voorvullen.

alter table public.uitnodigingen add column if not exists bedoeld_voor text;

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
    'code', u.code,
    'bedoeld_voor', u.bedoeld_voor
  )
  from public.uitnodigingen u
  left join public.stars s on s.id = u.uitgever_star_id
  where u.token = p_token and u.status = 'open'
  union all
  select jsonb_build_object(
    'geldig', false, 'uitnodiger', null, 'code', null, 'bedoeld_voor', null
  )
  where not exists (
    select 1 from public.uitnodigingen where token = p_token and status = 'open'
  )
  limit 1;
$$;
