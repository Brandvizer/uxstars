-- RLS voor beheerders. Herbruikbare helper die checkt of de ingelogde
-- gebruiker op de allowlist staat. SECURITY DEFINER omzeilt de RLS op admins
-- (zo hoeft die tabel niet leesbaar te zijn voor de check).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where email = (auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Beheerders zien álle missies (ook concept/in_review/gearchiveerd) en mogen
-- ze bijwerken (bijv. status van in_review naar open). De publieke leespolicy
-- (open + gevuld) blijft daarnaast bestaan; policies zijn OR-gewijs.
create policy "admins lezen alle missies"
  on public.missies for select
  to authenticated
  using (public.is_admin());

create policy "admins wijzigen missies"
  on public.missies for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Beheerders mogen de (privé) opdrachtgevergegevens lezen bij het beoordelen.
create policy "admins lezen opdrachtgevers"
  on public.opdrachtgevers for select
  to authenticated
  using (public.is_admin());
