-- Wachtlijst-verwerking: geef admins acties op pre-launch aanmeldingen.
-- Status + de mogelijkheid om iemand uit te nodigen (designer -> founder-vouch)
-- of af te wijzen.

alter table public.wachtlijst
  add column if not exists status text not null default 'nieuw'
    check (status in ('nieuw', 'uitgenodigd', 'benaderd', 'afgewezen')),
  add column if not exists uitnodiging_id uuid
    references public.uitnodigingen (id) on delete set null,
  add column if not exists verwerkt_op timestamptz;

-- admin_wachtlijst: nu inclusief status + (indien uitgenodigd) het invite-token.
create or replace function public.admin_wachtlijst()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', w.id, 'naam', w.naam, 'email', w.email, 'type', w.type,
      'status', w.status, 'created_at', w.created_at,
      'uitnodiging_token', u.token
    ) order by w.created_at desc), '[]'::jsonb)
  from public.wachtlijst w
  left join public.uitnodigingen u on u.id = w.uitnodiging_id
  where public.is_admin();
$$;
revoke all on function public.admin_wachtlijst() from public;
grant execute on function public.admin_wachtlijst() to authenticated;

-- Zet de status van een wachtlijst-item (afwijzen, benaderd, of terugzetten).
create or replace function public.zet_wachtlijst_status(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;
  if p_status not in ('nieuw', 'uitgenodigd', 'benaderd', 'afgewezen') then
    raise exception 'Ongeldige status';
  end if;
  update public.wachtlijst
    set status = p_status,
        verwerkt_op = case when p_status = 'nieuw' then null else now() end
  where id = p_id;
end; $$;
revoke all on function public.zet_wachtlijst_status(uuid, text) from public;
grant execute on function public.zet_wachtlijst_status(uuid, text) to authenticated;

-- Nodig een wachtlijst-designer uit: maak een founder-vouch (bootstrap-uitnodiging
-- zonder uitgevende ster) en koppel die aan het wachtlijst-item. Geeft het token
-- terug zodat de server-actie er een /uitnodiging-link + mail van maakt.
create or replace function public.nodig_wachtlijst_uit(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_email text; v_naam text; v_type text;
  v_token text := gen_random_uuid()::text;
  v_inv   uuid;
begin
  if not public.is_admin() then raise exception 'Alleen beheerders'; end if;

  select email, naam, type into v_email, v_naam, v_type
  from public.wachtlijst where id = p_id;
  if v_email is null then raise exception 'Wachtlijst-item niet gevonden'; end if;

  insert into public.uitnodigingen (token, uitgever_star_id)
  values (v_token, null) returning id into v_inv;

  update public.wachtlijst
    set status = 'uitgenodigd', uitnodiging_id = v_inv, verwerkt_op = now()
  where id = p_id;

  return jsonb_build_object(
    'token', v_token, 'email', v_email, 'naam', coalesce(v_naam, ''), 'type', v_type
  );
end; $$;
revoke all on function public.nodig_wachtlijst_uit(uuid) from public;
grant execute on function public.nodig_wachtlijst_uit(uuid) to authenticated;
