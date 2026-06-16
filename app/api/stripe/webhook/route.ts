import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { getSupabaseService } from "@/lib/supabase";

function mapStatus(s: Stripe.Subscription.Status): string {
  if (s === "trialing") return "trial";
  if (s === "active") return "actief";
  if (s === "past_due" || s === "unpaid") return "verlopen";
  return "geen"; // canceled / incomplete / paused
}

async function syncSub(sub: Stripe.Subscription) {
  const svc = getSupabaseService();
  if (!svc) return;

  const interval = sub.items.data[0]?.price?.recurring?.interval;
  // current_period_end leeft per API-versie op de sub óf op het item.
  const periodEnd =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items.data[0] as unknown as { current_period_end?: number })
      ?.current_period_end ??
    null;

  const update = {
    membership_status: mapStatus(sub.status),
    membership_tier: interval === "year" ? "partner_jaar" : "partner_maand",
    membership_tot: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    stripe_subscription_id: sub.id,
  };

  const bedrijfId = sub.metadata?.bedrijf_id;
  if (bedrijfId) {
    await svc.from("opdrachtgevers").update(update).eq("id", bedrijfId);
  } else {
    await svc
      .from("opdrachtgevers")
      .update(update)
      .eq("stripe_customer_id", sub.customer as string);
  }
}

export async function POST(req: NextRequest) {
  if (!stripe)
    return NextResponse.json({ error: "geen stripe" }, { status: 500 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig)
    return NextResponse.json({ error: "geen secret" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    console.error("stripe webhook signature:", (e as Error).message);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );
        await syncSub(sub);
      }
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSub(event.data.object as Stripe.Subscription);
    }
  } catch (e) {
    console.error("stripe webhook handler:", (e as Error).message);
  }

  return NextResponse.json({ received: true });
}
