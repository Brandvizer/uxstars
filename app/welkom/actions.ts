"use server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { stuurMail, emailHtml } from "@/lib/mail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://uxstars.vercel.app";

/**
 * Feestelijke welkomstmail zodra iemand een ster wordt. Maakt de twee
 * superkrachten glashelder: je eigen profiel + je eigen vouch. Faalt stil
 * (mail is bijzaak, de onboarding zelf is al gelukt).
 */
export async function verstuurSterWelkom(naam: string): Promise<void> {
  const supabase = await getSupabaseServer();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email;
  if (!email) return;

  const voornaam = naam.split(" ")[0] || naam;

  await stuurMail({
    naar: email,
    onderwerp: "Je bent nu een ster ✦",
    html: emailHtml({
      voorkop: "Welkom in het stelsel",
      kop: `${voornaam}, je bent nu een ster ✦`,
      alineas: [
        "Vanaf nu heb je een vaste plek tussen de sterren. Twee dingen zijn nu van jou:",
        "<strong>Je eigen profiel</strong> — log in wanneer je wilt, houd je beschikbaarheid bij en reageer op missies die alleen gevouchte designers te zien krijgen.",
        "<strong>Je eigen vouch</strong> — jij mag nu één designer binnenhalen. Kies met zorg: het stelsel groeit door wie jij kiest.",
      ],
      knop: { label: "Naar je profiel", url: `${SITE_URL}/account` },
    }),
  });
}
