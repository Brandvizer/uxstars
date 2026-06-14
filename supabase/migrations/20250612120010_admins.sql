-- Admin-allowlist. Eén bron van waarheid voor zowel de /admin-toegang als de
-- RLS-policies (stap 3). Een admin toevoegen = één INSERT, geen redeploy.
--
-- De e-mailadressen staan bewust NIET in deze migratie (niet in git); voeg ze
-- los toe in de SQL-editor, bijv.:
--   insert into public.admins (email) values ('jij@voorbeeld.nl');
create table public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Een ingelogde gebruiker mag alleen zijn eigen admin-rij zien (voor de gate).
-- Niemand kan de tabel uitlezen of wijzigen via de API.
create policy "lees eigen admin-status"
  on public.admins for select
  to authenticated
  using (email = (auth.jwt() ->> 'email'));

comment on table public.admins is 'Allowlist van admin-e-mailadressen voor /admin.';
