-- Admin kan een vouch-aanvraag verwijderen (opschonen van de kandidatenpool).
create or replace function public.verwijder_vouch_aanvraag(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Geen toegang'; end if;
  delete from public.vouch_aanvragen where id = p_id;
end;
$$;

revoke all on function public.verwijder_vouch_aanvraag(uuid) from public;
grant execute on function public.verwijder_vouch_aanvraag(uuid) to authenticated;
