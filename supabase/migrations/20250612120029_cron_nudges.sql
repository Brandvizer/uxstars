-- Cron-nudges: tijdgebonden herinneringen (vouch + beschikbaarheid).
-- Timestamp-kolommen voorkomen dubbel-mailen; functies leveren de kandidaten.

alter table public.stars
  add column if not exists vouch_herinnerd_op timestamptz,
  add column if not exists beschikbaarheid_gepingd_op timestamptz;

-- Sterren met een nog niet weggegeven vouch (open uitnodiging), minstens 3 dagen
-- lid, en de afgelopen 21 dagen niet herinnerd.
create or replace function public.cron_vouch_kandidaten()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('id', x.id, 'naam', x.naam, 'email', x.email, 'token', x.token)),
    '[]'::jsonb
  )
  from (
    select distinct on (s.id) s.id, s.naam, s.email, u.token
    from public.stars s
    join public.uitnodigingen u
      on u.uitgever_star_id = s.id and u.status = 'open'
    where s.email is not null
      and s.email not ilike '%.example'
      and s.email not ilike '%.test'
      and s.email not ilike '%.invalid'
      and s.status in ('actief', 'gevouched')
      and s.created_at < now() - interval '3 days'
      and (s.vouch_herinnerd_op is null or s.vouch_herinnerd_op < now() - interval '21 days')
    order by s.id, u.created_at desc
    limit 50
  ) x;
$$;

-- Actieve sterren wiens profiel >30 dagen niet is bijgewerkt en die >30 dagen
-- niet zijn gepingd over hun beschikbaarheid.
create or replace function public.cron_beschikbaarheid_kandidaten()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('id', s.id, 'naam', s.naam, 'email', s.email)),
    '[]'::jsonb
  )
  from public.stars s
  where s.email is not null
    and s.email not ilike '%.example'
    and s.email not ilike '%.test'
    and s.email not ilike '%.invalid'
    and s.status = 'actief'
    and s.updated_at < now() - interval '30 days'
    and (s.beschikbaarheid_gepingd_op is null or s.beschikbaarheid_gepingd_op < now() - interval '30 days')
  limit 50;
$$;

create or replace function public.cron_markeer_vouch_nudge(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.stars set vouch_herinnerd_op = now() where id = p_id;
$$;

create or replace function public.cron_markeer_beschikbaarheid_nudge(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.stars set beschikbaarheid_gepingd_op = now() where id = p_id;
$$;

-- Alleen de server (service_role) mag deze cron-functies aanroepen.
revoke all on function public.cron_vouch_kandidaten() from public, anon, authenticated;
revoke all on function public.cron_beschikbaarheid_kandidaten() from public, anon, authenticated;
revoke all on function public.cron_markeer_vouch_nudge(uuid) from public, anon, authenticated;
revoke all on function public.cron_markeer_beschikbaarheid_nudge(uuid) from public, anon, authenticated;
grant execute on function public.cron_vouch_kandidaten() to service_role;
grant execute on function public.cron_beschikbaarheid_kandidaten() to service_role;
grant execute on function public.cron_markeer_vouch_nudge(uuid) to service_role;
grant execute on function public.cron_markeer_beschikbaarheid_nudge(uuid) to service_role;
