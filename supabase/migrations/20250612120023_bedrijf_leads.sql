-- "Breng een opdrachtgever binnen" — de vouch, maar dan voor de vraagkant.
--
-- Een ster beveelt een opdrachtgever aan; die landt als lead in de admin-pool.
-- Toegang loopt volledig via SECURITY DEFINER-functies.

create table if not exists public.bedrijf_leads (
  id            uuid primary key default gen_random_uuid(),
  ster_id       uuid references public.stars (id) on delete set null,
  bedrijf_naam  text not null,
  contact_naam  text,
  contact_email text,
  toelichting   text,
  status        text not null default 'nieuw'
                check (status in ('nieuw', 'benaderd', 'binnen', 'afgewezen')),
  created_at    timestamptz not null default now()
);

create index if not exists bedrijf_leads_ster_idx on public.bedrijf_leads (ster_id);

alter table public.bedrijf_leads enable row level security;
-- Geen directe policies: alles via de functies hieronder.

-- ── Ster beveelt een opdrachtgever aan ──────────────────────────────────────
create or replace function public.beveel_bedrijf_aan(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_star uuid;
begin
  select id into v_star from public.stars where user_id = auth.uid();
  if v_star is null then raise exception 'Geen ster-account'; end if;
  if coalesce(trim(payload ->> 'bedrijf_naam'), '') = '' then
    raise exception 'Bedrijfsnaam ontbreekt';
  end if;

  insert into public.bedrijf_leads (ster_id, bedrijf_naam, contact_naam, contact_email, toelichting)
  values (
    v_star,
    payload ->> 'bedrijf_naam',
    nullif(payload ->> 'contact_naam', ''),
    nullif(payload ->> 'contact_email', ''),
    nullif(payload ->> 'toelichting', '')
  );
end;
$$;

revoke all on function public.beveel_bedrijf_aan(jsonb) from public;
grant execute on function public.beveel_bedrijf_aan(jsonb) to authenticated;

-- ── Eigen aanbevelingen van de ster (met status) ────────────────────────────
create or replace function public.mijn_aanbevelingen()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', l.id, 'bedrijf_naam', l.bedrijf_naam,
        'status', l.status, 'created_at', l.created_at
      ) order by l.created_at desc
    ), '[]'::jsonb
  )
  from public.bedrijf_leads l
  join public.stars s on s.id = l.ster_id
  where s.user_id = auth.uid();
$$;

revoke all on function public.mijn_aanbevelingen() from public;
grant execute on function public.mijn_aanbevelingen() to authenticated;

-- ── Admin: alle leads (met aanbrenger) ──────────────────────────────────────
create or replace function public.admin_bedrijf_leads()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', l.id, 'bedrijf_naam', l.bedrijf_naam, 'contact_naam', l.contact_naam,
        'contact_email', l.contact_email, 'toelichting', l.toelichting,
        'status', l.status, 'ster_naam', s.naam, 'created_at', l.created_at
      ) order by l.created_at desc
    ), '[]'::jsonb
  )
  from public.bedrijf_leads l
  left join public.stars s on s.id = l.ster_id
  where public.is_admin();
$$;

revoke all on function public.admin_bedrijf_leads() from public;
grant execute on function public.admin_bedrijf_leads() to authenticated;

-- ── Admin: lead-status bijwerken ────────────────────────────────────────────
create or replace function public.zet_lead_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Geen toegang'; end if;
  update public.bedrijf_leads set status = p_status where id = p_id;
end;
$$;

revoke all on function public.zet_lead_status(uuid, text) from public;
grant execute on function public.zet_lead_status(uuid, text) to authenticated;
