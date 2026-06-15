-- Sterren reageren op open missies.

-- Eén reactie per ster per missie.
alter table public.reacties
  add constraint reacties_missie_star_key unique (missie_id, star_id);

-- Een ingelogde ster reageert op een open missie.
create or replace function public.reageer_op_missie(p_missie_id uuid, p_motivatie text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_star_id uuid;
begin
  select id into v_star_id from public.stars where user_id = auth.uid();
  if v_star_id is null then
    raise exception 'Geen ster-account';
  end if;

  if not exists (select 1 from public.missies where id = p_missie_id and status = 'open') then
    raise exception 'Missie niet beschikbaar';
  end if;

  insert into public.reacties (missie_id, star_id, motivatie, status)
  values (p_missie_id, v_star_id, nullif(p_motivatie, ''), 'nieuw')
  on conflict (missie_id, star_id) do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.reageer_op_missie(uuid, text) from public;
grant execute on function public.reageer_op_missie(uuid, text) to authenticated;

-- Heeft de ingelogde ster al gereageerd op deze missie?
create or replace function public.mijn_reactie(p_missie_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object('status', r.status)
  from public.reacties r
  join public.stars s on s.id = r.star_id
  where r.missie_id = p_missie_id and s.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.mijn_reactie(uuid) from public;
grant execute on function public.mijn_reactie(uuid) to authenticated;
