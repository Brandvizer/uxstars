import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

/** Of Stripe is geconfigureerd (test of live). */
export const stripeGeconfigureerd = Boolean(key);

/** Server-side Stripe-client. Null als er geen key is. */
export const stripe = key ? new Stripe(key) : null;
