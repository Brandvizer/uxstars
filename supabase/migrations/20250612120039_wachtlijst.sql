-- Wachtlijst voor de pre-launch teaser: designers én opdrachtgevers kunnen zich
-- alvast aanmelden. Publieke insert via functie; admin leest de lijst.

create table if not exists public.wachtlijst (
  id         uuid primary key default gen_random_uuid(),
  naam       text,
  email      text not null,
  type       text not null check (type in ('designer', 'opdrachtgever')),
  created_at timestamptz not null default now(),
  unique (email, type)
);

alter table public.wachtlijst enable row level security;

create or replace function public.meld_wachtlijst_aan(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(payload ->> 'email'));
  v_type  text := payload ->> 'type';
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Ongeldig e-mailadres';
  end if;
  if v_type not in ('designer', 'opdrachtgever') then
    v_type := 'designer';
  end if;
  insert into public.wachtlijst (naam, email, type)
  values (nullif(trim(payload ->> 'naam'), ''), v_email, v_type)
  on conflict (email, type) do nothing;
end;
$$;

revoke all on function public.meld_wachtlijst_aan(jsonb) from public;
grant execute on function public.meld_wachtlijst_aan(jsonb) to anon, authenticated;

create or replace function public.admin_wachtlijst()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', w.id, 'naam', w.naam, 'email', w.email,
      'type', w.type, 'created_at', w.created_at
    ) order by w.created_at desc),
    '[]'::jsonb
  )
  from public.wachtlijst w
  where public.is_admin();
$$;

revoke all on function public.admin_wachtlijst() from public;
grant execute on function public.admin_wachtlijst() to authenticated;
