"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { stuurMail, emailHtml, esc } from "@/lib/mail";
import type { Json } from "@/lib/database.types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://uxstars.vercel.app";

/**
 * Stuurt je eigen vouch als mail naar één ontvanger. Haalt je uitnodiging +
 * naam server-side op (niet te vertrouwen vanaf de client) en weigert als je
 * vouch al is gebruikt.
 */
export async function verstuurVouchNaar(
  naarEmail: string,
  bericht?: string,
): Promise<{ ok: boolean; fout?: string }> {
  const email = naarEmail.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, fout: "ongeldig-adres" };
  }

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false, fout: "geen-db" };

  const { data: uitnodiging } = await supabase.rpc("mijn_uitnodiging");
  const u = uitnodiging as
    | { token: string; code: string | null; status: string }
    | null;
  if (!u || u.status !== "open") {
    return { ok: false, fout: "geen-open-vouch" };
  }

  const { data: profiel } = await supabase.rpc("mijn_profiel");
  const naam = (profiel as { naam: string }[] | null)?.[0]?.naam ?? "Een ster";
  const voornaam = naam.split(" ")[0] || naam;
  const schoonBericht = (bericht ?? "").trim().slice(0, 500);

  const { ok } = await stuurMail({
    naar: email,
    onderwerp: `${voornaam} vouchte jou voor UXSTARS ✦`,
    html: emailHtml({
      voorkop: "Je hebt een vouch ontvangen",
      kop: `${esc(voornaam)} vouchte jou voor UXSTARS ✦`,
      alineas: [
        schoonBericht ? `&ldquo;${esc(schoonBericht)}&rdquo;` : "",
        `${esc(naam)} geeft jou een plek in UXSTARS — een besloten netwerk van gevouchte UX-designers. Alleen wie een vouch krijgt, komt binnen.`,
        "Open de link hieronder en <strong>kras je vouch open</strong>. Daarna maak je je account aan en beoordelen wij je aanmelding kort.",
      ],
      knop: { label: "Kras je vouch open ✦", url: `${SITE_URL}/uitnodiging/${u.token}` },
    }),
  });

  return ok ? { ok: true } : { ok: false, fout: "mail" };
}

export async function werkProfielBij(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { error } = await supabase.rpc("werk_profiel_bij", {
    payload: payload as Json,
  });
  if (error) {
    console.error("werk_profiel_bij:", error.message);
    return { ok: false };
  }

  // Profiel + sterrenveld (beschikbaarheid/specialisme) verversen.
  revalidatePath("/account");
  revalidatePath("/");
  return { ok: true };
}

/** Ster beveelt een opdrachtgever aan (lead naar de admin-pool). */
export async function beveelBedrijfAan(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("beveel_bedrijf_aan", {
    payload: payload as Json,
  });
  if (error) {
    console.error("beveel_bedrijf_aan:", error.message);
    return { ok: false };
  }
  revalidatePath("/account");
  return { ok: true };
}

export async function uitloggenStar() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/account/login");
}
