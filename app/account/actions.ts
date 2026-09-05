"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseService } from "@/lib/supabase";
import { stuurMail, emailHtml, esc } from "@/lib/mail";
import type { Json } from "@/lib/database.types";
import { aanbrengLink, geldigeAanbrengCode } from "@/lib/aanbrengen";
import { MEMBERSHIP } from "@/lib/membership";

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

  // Onthoud voor wie de vouch bedoeld is (voor prefill op de aanmeld-stap).
  const svc = getSupabaseService();
  if (svc) {
    await svc
      .from("uitnodigingen")
      .update({ bedoeld_voor: email })
      .eq("token", u.token);
  }

  const { ok } = await stuurMail({
    naar: email,
    onderwerp: `${voornaam} vouchte jou voor UXSTARS`,
    html: emailHtml({
      voorkop: "Je hebt een vouch ontvangen",
      kop: `${esc(voornaam)} vouchte jou voor UXSTARS`,
      alineas: [
        schoonBericht ? `&ldquo;${esc(schoonBericht)}&rdquo;` : "",
        `${esc(naam)} geeft jou een plek in UXSTARS. Een besloten netwerk van gevouchte digital designers. Alleen wie een vouch krijgt, komt binnen.`,
        "Open de link hieronder en <strong>kras je vouch open</strong>. Daarna maak je je account aan en beoordelen wij je aanmelding kort.",
      ],
      knop: { label: "Kras je vouch open", url: `${SITE_URL}/uitnodiging/${u.token}` },
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

/**
 * Ster beveelt een opdrachtgever aan (lead naar de admin-pool). Is er een
 * e-mailadres, dan krijgt de opdrachtgever direct een uitnodiging met de
 * persoonlijke aanbrenglink van de ster, zodat de koppeling automatisch loopt
 * en de ster later zijn beloning krijgt.
 */
export async function beveelBedrijfAan(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; gemaild: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false, gemaild: false };
  const { error } = await supabase.rpc("beveel_bedrijf_aan", {
    payload: payload as Json,
  });
  if (error) {
    console.error("beveel_bedrijf_aan:", error.message);
    return { ok: false, gemaild: false };
  }
  revalidatePath("/account");

  const naar = String(payload.contact_email ?? "").trim();
  if (!naar) return { ok: true, gemaild: false };

  const { data: profiel } = await supabase.rpc("mijn_profiel");
  const ster = (Array.isArray(profiel) ? profiel[0] : profiel) as
    | { naam?: string; aanbreng_code?: string | null }
    | null;
  const code = geldigeAanbrengCode(ster?.aanbreng_code);
  if (!ster?.naam || !code) return { ok: true, gemaild: false };

  const voornaam = ster.naam.split(" ")[0];
  const contact = String(payload.contact_naam ?? "").trim().split(" ")[0];
  const bedrijf = String(payload.bedrijf_naam ?? "").trim();
  const toelichting = String(payload.toelichting ?? "").trim();
  const link = aanbrengLink(SITE_URL, code);

  const r = await stuurMail({
    naar,
    onderwerp: `${voornaam} denkt dat ${bedrijf || "jullie"} een ster zoekt`,
    html: emailHtml({
      voorkop: "Aanbevolen door een ster",
      kop: `${esc(contact ? `Hoi ${contact}` : "Hoi")}, ${esc(voornaam)} brengt je naar UXSTARS`,
      alineas: [
        `<strong style="color:#0a0e1a;">${esc(ster.naam)}</strong> is een van onze gevouchte digital designers en denkt dat ${esc(bedrijf || "jouw organisatie")} baat heeft bij een ster uit ons stelsel.`,
        ...(toelichting ? [`In ${esc(voornaam)}s woorden: &ldquo;${esc(toelichting)}&rdquo;`] : []),
        `UXSTARS is een besloten netwerk van digital designers die voor elkaar instaan. Je plaatst een missie, wij brengen die bij de juiste sterren, en binnen dagen spreek je de eerste kandidaten. Geen bureau, geen marge op marge, één helder tarief.`,
        `De eerste ${MEMBERSHIP.trialDagen} dagen zijn gratis. Via de knop hieronder maak je een bedrijfsaccount aan; ${esc(voornaam)} blijft dan aan jullie gekoppeld.`,
      ],
      knop: { label: "Bekijk UXSTARS voor opdrachtgevers", url: link },
    }),
  });
  return { ok: true, gemaild: r.ok };
}

export async function uitloggenStar() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/account/login");
}
