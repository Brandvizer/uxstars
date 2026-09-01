-- Een ster ziet z'n eigen reacties op missies terug (met missie-details + status).

create or replace function public.mijn_reacties()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'missie_titel', m.titel,
        'missie_slug', m.slug,
        'missie_status', m.status,
        'status', r.status,
        'created_at', r.created_at
      )
      order by r.created_at desc
    ),
    '[]'::jsonb
  )
  from public.reacties r
  join public.missies m on m.id = r.missie_id
  join public.stars s on s.id = r.star_id
  where s.user_id = auth.uid();
$$;

revoke all on function public.mijn_reacties() from public;
grant execute on function public.mijn_reacties() to authenticated;
