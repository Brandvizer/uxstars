-- Stripe-koppeling op bedrijven: customer + subscription voor membership-betaling.
alter table public.opdrachtgevers
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists opdrachtgevers_stripe_customer_idx
  on public.opdrachtgevers (stripe_customer_id);
