-- Bedrijf start zelf een membership-proefperiode + legt de plankeuze vast.
-- Nieuw/verlopen → 30 dagen trial; al actief/trial → alleen de tier-keuze.
-- (De echte betaling volgt later via Stripe.)

create or replace function public.start_membership_trial(p_tier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd'; end if;

  select id into v_id from public.opdrachtgevers where user_id = auth.uid();
  if v_id is null then raise exception 'Geen bedrijfsaccount'; end if;

  update public.opdrachtgevers set
    membership_tier   = nullif(p_tier, ''),
    membership_status = 'trial',
    membership_tot    = now() + interval '30 days'
  where id = v_id and membership_status in ('geen', 'verlopen');

  update public.opdrachtgevers set
    membership_tier = nullif(p_tier, '')
  where id = v_id and membership_status not in ('geen', 'verlopen');
end;
$$;

revoke all on function public.start_membership_trial(text) from public;
grant execute on function public.start_membership_trial(text) to authenticated;
