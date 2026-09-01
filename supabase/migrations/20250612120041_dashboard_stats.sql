-- Data-dashboard voor de admin: één functie die de belangrijkste cijfers
-- teruggeeft (wachtlijst, aanmeldingen, sterren, missies, opdrachtgevers) plus
-- een 30-daagse reeks van wachtlijst-aanmeldingen voor een grafiek.

create or replace function public.dashboard_stats()
returns jsonb language sql security definer set search_path = public stable as $$
  select case when not public.is_admin() then '{}'::jsonb else jsonb_build_object(
    'wachtlijst', jsonb_build_object(
      'totaal',         (select count(*) from public.wachtlijst),
      'designers',      (select count(*) from public.wachtlijst where type = 'designer'),
      'opdrachtgevers', (select count(*) from public.wachtlijst where type = 'opdrachtgever'),
      'nieuw',          (select count(*) from public.wachtlijst where status = 'nieuw'),
      'uitgenodigd',    (select count(*) from public.wachtlijst where status = 'uitgenodigd'),
      'benaderd',       (select count(*) from public.wachtlijst where status = 'benaderd'),
      'afgewezen',      (select count(*) from public.wachtlijst where status = 'afgewezen'),
      'laatste7',       (select count(*) from public.wachtlijst where created_at >= now() - interval '7 days'),
      'laatste30',      (select count(*) from public.wachtlijst where created_at >= now() - interval '30 days')
    ),
    'reeks', (
      select coalesce(jsonb_agg(jsonb_build_object(
          'datum', d::date, 'aantal', coalesce(c.n, 0)
        ) order by d), '[]'::jsonb)
      from generate_series(
        (current_date - interval '29 days')::date, current_date, interval '1 day'
      ) d
      left join (
        select created_at::date dd, count(*) n
        from public.wachtlijst
        where created_at >= current_date - interval '29 days'
        group by 1
      ) c on c.dd = d::date
    ),
    'aanmeldingen', jsonb_build_object(
      'totaal',      (select count(*) from public.aanmeldingen),
      'nieuw',       (select count(*) from public.aanmeldingen where status = 'nieuw'),
      'goedgekeurd', (select count(*) from public.aanmeldingen where status = 'goedgekeurd'),
      'afgewezen',   (select count(*) from public.aanmeldingen where status = 'afgewezen')
    ),
    'sterren', jsonb_build_object(
      'actief', (select count(*) from public.stars where status = 'actief'),
      'totaal', (select count(*) from public.stars)
    ),
    'missies', jsonb_build_object(
      'open',   (select count(*) from public.missies where status = 'open'),
      'totaal', (select count(*) from public.missies)
    ),
    'opdrachtgevers', jsonb_build_object(
      'totaal',            (select count(*) from public.opdrachtgevers),
      'membership_actief', (select count(*) from public.opdrachtgevers where membership_status = 'actief'),
      'membership_trial',  (select count(*) from public.opdrachtgevers where membership_status = 'trial')
    )
  ) end;
$$;
revoke all on function public.dashboard_stats() from public;
grant execute on function public.dashboard_stats() to authenticated;
