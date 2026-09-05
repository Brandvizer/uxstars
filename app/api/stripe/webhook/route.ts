import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { getSupabaseService } from "@/lib/supabase";
import { stuurMail, emailHtml, esc } from "@/lib/mail";
import { AANBRENGEN } from "@/lib/aanbrengen";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://uxstars.vercel.app";

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

/**
 * Eerste betaalde factuur van een bedrijf (bedrag > 0, dus niet de proefperiode):
 * registreer de aanbrengbeloning voor de ster die het bedrijf binnenbracht.
 * Idempotent via de database (één beloning per bedrijf); een herhaalde webhook
 * of tweede factuur doet niets.
 */
async function verwerkBetaaldeFactuur(invoice: Stripe.Invoice) {
  if ((invoice.amount_paid ?? 0) <= 0) return;
  const svc = getSupabaseService();
  if (!svc) return;

  // Bedrijf vinden: via metadata op de subscription, anders via de customer.
  // De subscription staat per Stripe API-versie op de invoice zelf of onder
  // parent.subscription_details; beide vormen afvangen.
  const inv = invoice as unknown as {
    subscription?: string | { id?: string } | null;
    parent?: { subscription_details?: { subscription?: string | { id?: string } | null } | null } | null;
  };
  const rawSub = inv.subscription ?? inv.parent?.subscription_details?.subscription ?? null;
  const subId = typeof rawSub === "string" ? rawSub : rawSub?.id ?? null;
  let bedrijfId: string | null = null;
  if (subId && stripe) {
    const sub = await stripe.subscriptions.retrieve(subId);
    bedrijfId = sub.metadata?.bedrijf_id ?? null;
  }
  if (!bedrijfId && invoice.customer) {
    const { data } = await svc
      .from("opdrachtgevers")
      .select("id")
      .eq("stripe_customer_id", invoice.customer as string)
      .maybeSingle();
    bedrijfId = data?.id ?? null;
  }
  if (!bedrijfId) return;

  const { data, error } = await svc.rpc("registreer_beloning", {
    p_bedrijf_id: bedrijfId,
    p_bedrag_cent: AANBRENGEN.bedragCent,
  });
  if (error) {
    console.error("registreer_beloning:", error.message);
    return;
  }
  const r = data as {
    nieuw: boolean;
    kenmerk?: string;
    ster_naam?: string;
    ster_email?: string | null;
    bedrijf_naam?: string;
  } | null;
  if (!r?.nieuw) return;

  const voornaam = (r.ster_naam ?? "").split(" ")[0];

  // Mail naar de ster: gefeliciteerd + hoe te factureren.
  if (r.ster_email) {
    await stuurMail({
      naar: r.ster_email,
      onderwerp: `${r.bedrijf_naam} is betalend Partner, jouw ${AANBRENGEN.bedragTekst} staat klaar`,
      html: emailHtml({
        voorkop: "Aanbrengbeloning",
        kop: `${esc(voornaam)}, ${esc(r.bedrijf_naam ?? "je opdrachtgever")} is binnen`,
        alineas: [
          `De opdrachtgever die jij aanbracht is zojuist betalend Partner geworden. Daarmee heb jij het stelsel aan de vraagkant laten groeien, en dat belonen we.`,
          `<strong>Je beloning: ${AANBRENGEN.bedragTekst}.</strong> Stuur een factuur van ${AANBRENGEN.bedragTekst} (excl. btw) aan UXSTARS BV naar ${AANBRENGEN.factuurNaar}, met kenmerk <strong>${esc(r.kenmerk ?? "")}</strong>. We betalen binnen 14 dagen.`,
          `<strong>En een extra vouch.</strong> Je hebt er weer één om weg te geven. Kies met zorg; zo groeit het stelsel door wie jij kiest.`,
        ],
        knop: { label: "Naar je account", url: `${SITE_URL}/account` },
      }),
    });
  }

  // Mail naar de admins: uitbetalen.
  const { data: admins } = await svc.from("admins").select("email");
  const ontvangers = (admins ?? [])
    .map((a) => a.email)
    .filter((e): e is string => Boolean(e));
  await Promise.all(
    ontvangers.map((naar) =>
      stuurMail({
        naar,
        onderwerp: `Beloning uitbetalen: ${AANBRENGEN.bedragTekst} aan ${r.ster_naam}`,
        html: emailHtml({
          voorkop: "Aanbrengbeloning",
          kop: `${esc(r.bedrijf_naam ?? "Bedrijf")} is betalend geworden`,
          alineas: [
            `Aangebracht door <strong style="color:#0a0e1a;">${esc(r.ster_naam ?? "")}</strong> (${esc(r.ster_email ?? "geen e-mail")}). Beloning ${AANBRENGEN.bedragTekst}, kenmerk ${esc(r.kenmerk ?? "")}.`,
            `De ster heeft een mail gekregen met het verzoek een factuur te sturen. Na betaling zet je de beloning in de admin op uitbetaald.`,
          ],
          knop: { label: "Open beloningen", url: `${SITE_URL}/admin/beloningen` },
        }),
      }),
    ),
  );
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
    } else if (event.type === "invoice.paid") {
      await verwerkBetaaldeFactuur(event.data.object as Stripe.Invoice);
    }
  } catch (e) {
    console.error("stripe webhook handler:", (e as Error).message);
  }

  return NextResponse.json({ received: true });
}
