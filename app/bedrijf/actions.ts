"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseService } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { MEMBERSHIP } from "@/lib/membership";
import { missieFormSchema } from "@/lib/validaties";
import type { Json } from "@/lib/database.types";

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "https://uxstars.vercel.app";
}

function slugify(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * Plaatst een missie namens het ingelogde bedrijf. De RPC eist een actief
 * membership en gebruikt het bedrijfsaccount (geen losse opdrachtgever).
 */
export async function plaatsMissieAlsBedrijf(
  ruweData: unknown,
): Promise<{ ok: boolean; slug?: string; fout?: string }> {
  const parsed = missieFormSchema.safeParse(ruweData);
  if (!parsed.success) return { ok: false, fout: "validatie" };
  const d = parsed.data;

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false, fout: "geen-db" };

  const slug = `${slugify(d.titel)}-${crypto.randomUUID().slice(0, 8)}`;
  const locatie =
    d.locatie === "Volledig remote"
      ? "Volledig remote"
      : `${d.locatie} · ${d.plaats ?? ""}`.trim();
  const intro =
    d.omschrijving.length > 180
      ? `${d.omschrijving.slice(0, 180).trimEnd()}…`
      : d.omschrijving;

  const { error } = await supabase.rpc("plaats_missie_als_bedrijf", {
    payload: {
      titel: d.titel,
      rol: d.rol,
      locatie,
      uren_per_week: d.urenPerWeek,
      duur: d.duur,
      tarief_indicatie: d.tarief,
      start_indicatie: d.start,
      intro,
      omschrijving: [d.omschrijving],
      slug,
    } as Json,
  });

  if (error) {
    console.error("plaats_missie_als_bedrijf:", error.message);
    return {
      ok: false,
      fout: error.message.includes("membership") ? "membership" : "opslaan",
    };
  }
  revalidatePath("/bedrijf");
  return { ok: true, slug };
}

/** Bewerkt een bestaande missie van het ingelogde bedrijf (gated in de RPC). */
export async function werkMissieBij(invoer: {
  id: string;
  titel: string;
  rol: string;
  locatie: string;
  uren_per_week: string;
  duur: string;
  tarief_indicatie: string;
  start_indicatie: string;
  omschrijving: string;
}): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const oms = invoer.omschrijving.trim();
  const intro = oms.length > 180 ? `${oms.slice(0, 180).trimEnd()}…` : oms;

  const { error } = await supabase.rpc("werk_missie_bij", {
    payload: {
      id: invoer.id,
      titel: invoer.titel,
      rol: invoer.rol,
      locatie: invoer.locatie,
      uren_per_week: invoer.uren_per_week,
      duur: invoer.duur,
      tarief_indicatie: invoer.tarief_indicatie,
      start_indicatie: invoer.start_indicatie,
      intro,
      omschrijving: oms ? [oms] : [],
    } as Json,
  });
  if (error) {
    console.error("werk_missie_bij:", error.message);
    return { ok: false };
  }
  revalidatePath("/bedrijf");
  return { ok: true };
}

/** Maakt (of koppelt) het bedrijfsaccount bij eerste login. Idempotent. */
export async function maakBedrijf(naam: string): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("maak_bedrijf", { p_naam: naam });
  if (error) {
    console.error("maak_bedrijf:", error.message);
    return { ok: false };
  }
  revalidatePath("/bedrijf");
  return { ok: true };
}

export async function werkBedrijfBij(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("werk_bedrijf_bij", {
    payload: payload as Json,
  });
  if (error) {
    console.error("werk_bedrijf_bij:", error.message);
    return { ok: false };
  }
  revalidatePath("/bedrijf");
  return { ok: true };
}

/** Bedrijf start de membership-proefperiode + legt de plankeuze vast. */
export async function startMembershipTrial(
  tier: string,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("start_membership_trial", {
    p_tier: tier,
  });
  if (error) {
    console.error("start_membership_trial:", error.message);
    return { ok: false };
  }
  revalidatePath("/bedrijf");
  return { ok: true };
}

/** Start een Stripe Checkout (abonnement met 30 dagen trial) voor het bedrijf. */
export async function startCheckout(
  ritme: "maand" | "jaar",
): Promise<{ ok: boolean; url?: string }> {
  if (!stripe) return { ok: false };
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const svc = getSupabaseService();
  if (!svc) return { ok: false };
  const { data: bedrijf } = await svc
    .from("opdrachtgevers")
    .select("id, naam, email, stripe_customer_id")
    .eq("user_id", user.id)
    .single();
  if (!bedrijf) return { ok: false };

  let customerId = bedrijf.stripe_customer_id;
  if (!customerId) {
    const c = await stripe.customers.create({
      email: bedrijf.email || user.email || undefined,
      name: bedrijf.naam,
      metadata: { bedrijf_id: bedrijf.id },
    });
    customerId = c.id;
    await svc
      .from("opdrachtgevers")
      .update({ stripe_customer_id: customerId })
      .eq("id", bedrijf.id);
  }

  const price =
    ritme === "jaar"
      ? process.env.STRIPE_PRICE_PARTNER_JAAR
      : process.env.STRIPE_PRICE_PARTNER_MAAND;
  if (!price) return { ok: false };

  const base = await origin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    subscription_data: {
      trial_period_days: MEMBERSHIP.trialDagen,
      metadata: { bedrijf_id: bedrijf.id },
    },
    metadata: { bedrijf_id: bedrijf.id },
    success_url: `${base}/bedrijf/welkom?succes=1`,
    cancel_url: `${base}/bedrijf/welkom`,
  });
  return { ok: true, url: session.url ?? undefined };
}

/** Opent de Stripe Customer Portal (abonnement beheren/opzeggen). */
export async function startPortal(): Promise<{ ok: boolean; url?: string }> {
  if (!stripe) return { ok: false };
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const svc = getSupabaseService();
  if (!svc) return { ok: false };
  const { data: bedrijf } = await svc
    .from("opdrachtgevers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();
  if (!bedrijf?.stripe_customer_id) return { ok: false };

  const session = await stripe.billingPortal.sessions.create({
    customer: bedrijf.stripe_customer_id,
    return_url: `${await origin()}/bedrijf`,
  });
  return { ok: true, url: session.url };
}

export async function uitloggenBedrijf() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/account/login");
}
