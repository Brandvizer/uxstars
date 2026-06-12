-- Vouches: een star staat in voor een andere star. De paren vormen de lijnen
-- in het sterrenveld; de id-paren zijn publiek leesbaar (toelichting niet).
create table public.vouches (
  id           uuid primary key default gen_random_uuid(),
  van_star_id  uuid not null references public.stars (id) on delete cascade,
  naar_star_id uuid not null references public.stars (id) on delete cascade,
  toelichting  text,
  created_at   timestamptz not null default now(),
  unique (van_star_id, naar_star_id),
  check (van_star_id <> naar_star_id)
);

create index vouches_van_idx on public.vouches (van_star_id);
create index vouches_naar_idx on public.vouches (naar_star_id);

comment on table public.vouches is 'Vouch-verbindingen tussen stars. Id-paren publiek (lijnen), toelichting privé.';
