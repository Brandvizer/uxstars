-- Profielfoto's: een ster kan een foto uploaden en toestemming geven om die
-- elders op de site te gebruiken.

alter table public.stars
  add column if not exists foto_url text,
  add column if not exists foto_toestemming boolean not null default false;

-- ── Storage-rechten op de bucket 'profielfotos' ─────────────────────────────
-- Pad-conventie: <user_id>/<bestand>. Een ster beheert alleen z'n eigen map.
create policy "publiek leest profielfotos"
  on storage.objects for select to public
  using (bucket_id = 'profielfotos');

create policy "ster uploadt eigen foto"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profielfotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ster vervangt eigen foto"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profielfotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ster verwijdert eigen foto"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profielfotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── werk_profiel_bij uitbreiden met foto + toestemming ──────────────────────
create or replace function public.werk_profiel_bij(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.stars set
    naam          = coalesce(nullif(payload ->> 'naam', ''), naam),
    specialisme   = coalesce(nullif(payload ->> 'specialisme', ''), specialisme),
    seniority     = coalesce(nullif(payload ->> 'seniority', ''), seniority),
    bio           = nullif(payload ->> 'bio', ''),
    portfolio_url = nullif(payload ->> 'portfolio_url', ''),
    linkedin_url  = nullif(payload ->> 'linkedin_url', ''),
    beschikbaar   = coalesce((payload ->> 'beschikbaar')::boolean, beschikbaar),
    tarief_uur    = nullif(payload ->> 'tarief_uur', '')::numeric,
    foto_url      = coalesce(nullif(payload ->> 'foto_url', ''), foto_url),
    foto_toestemming = coalesce((payload ->> 'foto_toestemming')::boolean, foto_toestemming),
    updated_at    = now()
  where user_id = auth.uid();
end;
$$;

revoke all on function public.werk_profiel_bij(jsonb) from public;
grant execute on function public.werk_profiel_bij(jsonb) to authenticated;
