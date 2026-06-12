-- Opdrachtgevers: organisaties die missies plaatsen. Privé (geen publieke RLS).
create table public.opdrachtgevers (
  id             uuid primary key default gen_random_uuid(),
  naam           text not null,                 -- organisatie / bedrijf
  contactpersoon text,
  email          text not null,
  telefoon       text,
  created_at     timestamptz not null default now()
);

comment on table public.opdrachtgevers is 'Organisaties die missies plaatsen. Niet publiek leesbaar.';
