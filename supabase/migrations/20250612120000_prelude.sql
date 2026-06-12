-- Prelude: extensies en gedeelde helpers.

-- gen_random_uuid() (standaard aanwezig op Supabase, maar expliciet voor lokaal)
create extension if not exists pgcrypto;

-- Houdt updated_at bij op tabellen die wijzigen.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
