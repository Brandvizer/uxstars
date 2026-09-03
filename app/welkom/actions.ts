"use server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseService } from "@/lib/supabase";
import { stuurMail, emailHtml, esc } from "@/lib/mail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://uxstars.vercel.app";
const NEXT = "/admin/aanmeldingen";

/** Bouwt een magic-inloglink voor een admin; valt terug op een gewone link. */
async function adminLink(
  svc: ReturnType<typeof getSupabaseService>,
  adminEmail: string,
): Promise<string> {
  if (!svc) return `${SITE_URL}${NEXT}`;
  const { data, error } = await svc.auth.admin.generateLink({
    type: "magiclink",
    email: adminEmail,
    options: { redirectTo: `${SITE_URL}/auth/confirm` },
  });
  if (error || !data?.properties?.hashed_token) return `${SITE_URL}${NEXT}`;
  const { hashed_token, verification_type } = data.properties;
  return (
    `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(hashed_token)}` +
    `&type=${encodeURIComponent(verification_type)}` +
    `&next=${encodeURIComponent(NEXT)}`
  );
}

/**
 * Meldt een nieuwe (gevouchte) aanmelding aan de admins, elk met een magic link
 * die ze direct ingelogd naar de aanmeldingen brengt. Faalt stil.
 */
export async function meldNieuweAanmelding(naam: string): Promise<void> {
  const svc = getSupabaseService();
  if (!svc) return;

  const supabase = await getSupabaseServer();
  const kandidaatEmail = supabase
    ? (await supabase.auth.getUser()).data.user?.email ?? "onbekend"
    : "onbekend";

  const { data: admins } = await svc.from("admins").select("email");
  const ontvangers = (admins ?? [])
    .map((a) => a.email)
    .filter((e): e is string => Boolean(e));
  if (ontvangers.length === 0) ontvangers.push("hallo@uxstars.nl");

  for (const adminEmail of ontvangers) {
    const url = await adminLink(svc, adminEmail);
    await stuurMail({
      naar: adminEmail,
      onderwerp: `Nieuwe aanmelding: ${naam}`,
      html: emailHtml({
        voorkop: "Aanmelding",
        kop: "Nieuwe gevouchte aanmelding",
        alineas: [
          `<strong>${esc(naam)}</strong> (${esc(kandidaatEmail)}) heeft een vouch ingewisseld en wacht op goedkeuring.`,
          "Klik hieronder. Je gaat direct ingelogd naar de aanmeldingen.",
        ],
        knop: { label: "Beoordeel de aanmelding", url },
      }),
    });
  }
}
