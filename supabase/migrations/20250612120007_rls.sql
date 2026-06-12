-- Row Level Security op alle tabellen.
--
-- Uitgangspunt: het publiek (rollen anon + authenticated) leest alleen:
--   • missies met status 'open'  (volledig)
--   • stars met status 'actief'  (zonder e-mail en tarief — kolomrechten)
--   • vouches                    (alleen de id-paren voor de lijnen)
-- Alle overige tabellen krijgen RLS aan zonder publieke policy, dus geen
-- publieke toegang. De service_role (seed/admin) omzeilt RLS automatisch.

-- ── RLS aanzetten ──────────────────────────────────────────────────────────
alter table public.opdrachtgevers enable row level security;
alter table public.stars          enable row level security;
alter table public.missies        enable row level security;
alter table public.reacties       enable row level security;
alter table public.vouches        enable row level security;
alter table public.plaatsingen    enable row level security;

-- ── Missies: publiek leest open missies (alle kolommen) ─────────────────────
create policy "publiek leest open missies"
  on public.missies for select
  to anon, authenticated
  using (status = 'open');

-- ── Stars: publiek leest actieve stars, maar niet e-mail/tarief ─────────────
-- Rijfilter via policy, kolomfilter via grants (RLS is niet kolomgewijs).
create policy "publiek leest actieve stars"
  on public.stars for select
  to anon, authenticated
  using (status = 'actief');

revoke select on public.stars from anon, authenticated;
grant select
  (id, naam, specialisme, seniority, bio, beschikbaar, status, created_at, updated_at)
  on public.stars to anon, authenticated;

-- ── Vouches: publiek leest de verbindingen (id-paren), niet de toelichting ──
create policy "publiek leest vouches"
  on public.vouches for select
  to anon, authenticated
  using (true);

revoke select on public.vouches from anon, authenticated;
grant select
  (id, van_star_id, naar_star_id, created_at)
  on public.vouches to anon, authenticated;

-- opdrachtgevers, reacties en plaatsingen krijgen bewust géén publieke policy:
-- met RLS aan en geen policy is er geen anon/authenticated toegang.
