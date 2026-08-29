"use server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { stuurMail, emailHtml, esc } from "@/lib/mail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://uxstars.vercel.app";

/**
 * Meldt een nieuwe (gevouchte) aanmelding aan het team, zodat de admin 'm kan
 * beoordelen. Faalt stil — de aanmelding zelf is al vastgelegd.
 */
export async function meldNieuweAanmelding(naam: string): Promise<void> {
  const supabase = await getSupabaseServer();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "onbekend";

  await stuurMail({
    naar: "hallo@uxstars.nl",
    onderwerp: `Nieuwe aanmelding: ${naam}`,
    html: emailHtml({
      voorkop: "Aanmelding",
      kop: "Nieuwe gevouchte aanmelding",
      alineas: [
        `<strong>${esc(naam)}</strong> (${esc(email)}) heeft een vouch ingewisseld en wacht op goedkeuring.`,
        "Bekijk en beoordeel de aanmelding in het admin-paneel.",
      ],
      knop: { label: "Naar aanmeldingen", url: `${SITE_URL}/admin/aanmeldingen` },
    }),
  });
}
