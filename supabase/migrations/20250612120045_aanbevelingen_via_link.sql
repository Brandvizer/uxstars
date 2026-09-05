-- Aanbevelingen van een ster: niet alleen de leads uit het formulier, maar ook
-- bedrijven die via de aanbrenglink binnenkwamen zonder lead. Status wordt
-- afgeleid uit het bedrijf zelf (proefperiode, betalend, beloning uitbetaald),
-- zodat de ster altijd ziet hoe zijn aanbeveling ervoor staat.
create or replace function public.mijn_aanbevelingen()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with ster as (
    select id from public.stars where user_id = auth.uid() limit 1
  ),
  -- Bedrijven die aan deze ster gekoppeld zijn (via link of lead-e-mail)
  bedrijven as (
    select
      o.id                    as bedrijf_id,
      o.naam                  as bedrijf_naam,
      o.created_at,
      case
        when b.status = 'uitbetaald'          then 'uitbetaald'
        when b.id is not null                 then 'betalend'
        when o.membership_status = 'actief'   then 'betalend'
        when o.membership_status = 'trial'    then 'proefperiode'
        else 'binnen'
      end as status
    from public.opdrachtgevers o
    left join public.beloningen b on b.bedrijf_id = o.id
    where o.aangebracht_door = (select id from ster)
  ),
  -- Leads uit het formulier die (nog) niet aan een bedrijf gekoppeld zijn
  losse_leads as (
    select
      l.id, l.bedrijf_naam, l.created_at, l.status
    from public.bedrijf_leads l
    where l.ster_id = (select id from ster)
      and (l.bedrijf_id is null or not exists (select 1 from bedrijven bv where bv.bedrijf_id = l.bedrijf_id))
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', id, 'bedrijf_naam', bedrijf_naam, 'status', status, 'created_at', created_at)
      order by created_at desc
    ), '[]'::jsonb
  )
  from (
    select bedrijf_id as id, bedrijf_naam, created_at, status from bedrijven
    union all
    select id, bedrijf_naam, created_at, status from losse_leads
  ) x;
$$;
