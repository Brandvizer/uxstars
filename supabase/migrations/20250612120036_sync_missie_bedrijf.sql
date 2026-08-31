-- Houd het gedenormaliseerde logo + label op missies in sync met het bedrijf.
-- Trigger vangt elke wijziging (onboarding, visitekaartje, admin, direct).

create or replace function public.sync_missie_bedrijf()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.logo_url is distinct from old.logo_url
     or new.naam is distinct from old.naam then
    update public.missies
    set opdrachtgever_logo = new.logo_url,
        opdrachtgever_label = new.naam
    where opdrachtgever_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_missie_bedrijf on public.opdrachtgevers;
create trigger trg_sync_missie_bedrijf
  after update of logo_url, naam on public.opdrachtgevers
  for each row execute function public.sync_missie_bedrijf();
