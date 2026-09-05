"use server";

import { headers } from "next/headers";
import { getSupabaseService } from "@/lib/supabase";
import { stuurMail, emailHtml, esc } from "@/lib/mail";

/**
 * Mailt de beheerders zodra een nieuwe aanmelding (founding of via vouch) is
 * ingediend. Draait server-side met de service-role key omdat de kandidaat niet
 * is ingelogd en RLS de admins-tabel afschermt. Faalt stil: de aanmelding staat
 * al in de database, de mail is alleen een seintje.
 */
export async function meldNieuweAanmeldingAanAdmins(
  naam: string,
  email: string,
  rol: string,
  seniority: string,
  viaVouch: boolean,
): Promise<void> {
  const svc = getSupabaseService();
  if (!svc) return;

  const { data } = await svc.from("admins").select("email");
  const ontvangers = (data ?? [])
    .map((a) => a.email)
    .filter((e): e is string => Boolean(e));
  if (ontvangers.length === 0) return;

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  const html = emailHtml({
    voorkop: viaVouch ? "Nieuwe aanmelding via vouch" : "Nieuwe founding-aanmelding",
    kop: `${esc(naam)} wil een ster worden`,
    alineas: [
      `<strong style="color:#0a0e1a;">${esc(naam)}</strong>, ${esc(rol)} (${esc(seniority)}), heeft zojuist een aanmelding ingediend${viaVouch ? " met een vouch" : " voor een founding-plek"}.`,
      `E-mail: ${esc(email)}`,
      "Bekijk portfolio, cv en motivatie en keur goed of wijs af.",
    ],
    knop: origin
      ? { label: "Beoordeel de aanmelding", url: `${origin}/admin/aanmeldingen` }
      : undefined,
  });

  await Promise.all(
    ontvangers.map((naar) =>
      stuurMail({
        naar,
        onderwerp: `Nieuwe aanmelding: ${naam}`,
        html,
      }),
    ),
  );
}
