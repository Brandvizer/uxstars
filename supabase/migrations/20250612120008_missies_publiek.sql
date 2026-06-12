-- Missies publiek presenteerbaar maken (append-only; eerdere migraties niet wijzigen).
--
-- 1) Publiek label op de missie zelf, zodat de detailpagina een opdrachtgever
--    kan tonen ("Energieleverancier (top 3 NL)") zonder de privé tabel
--    opdrachtgevers te hoeven lezen. De échte klant + contact blijft privé.
alter table public.missies
  add column if not exists opdrachtgever_label text;

comment on column public.missies.opdrachtgever_label is
  'Publiek tonbare omschrijving van de opdrachtgever. De echte klant staat privé in opdrachtgevers.';

-- 2) Publiek leest naast open ook gevulde missies (social proof). Concept,
--    in_review en gearchiveerd blijven privé.
drop policy if exists "publiek leest open missies" on public.missies;

create policy "publiek leest open en gevulde missies"
  on public.missies for select
  to anon, authenticated
  using (status in ('open', 'gevuld'));
