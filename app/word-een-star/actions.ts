"use server";

import { headers } from "next/headers";
import { getSupabaseService } from "@/lib/supabase";
import { stuurMail, emailHtml, esc } from "@/lib/mail";

/**
 * Mailt de beheerders zodra er een nieuwe vouch-aanvraag binnenkomt. Draait
 * server-side met de service-role key omdat de aanvrager niet is ingelogd en
 * RLS de admins-tabel afschermt. Faalt stil (mail is een notificatie, geen
 * blokkade) — de aanvraag staat sowieso al in de pool.
 */
export async function meldNieuweVouchAanvraag(
  naam: string,
  email: string,
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
    voorkop: "Nieuwe vouch-aanvraag",
    kop: "Iemand wil het stelsel in",
    alineas: [
      `<strong style="color:#f2f4f8;">${esc(naam)}</strong> vroeg zojuist een vouch aan.`,
      `E-mail: ${esc(email)}`,
      "Bekijk de aanvraag in je kandidatenpool — geef je vouch of wijs af.",
    ],
    knop: origin
      ? { label: "Open kandidatenpool", url: `${origin}/admin/uitnodigingen` }
      : undefined,
  });

  await Promise.all(
    ontvangers.map((naar) =>
      stuurMail({
        naar,
        onderwerp: `Nieuwe vouch-aanvraag: ${naam}`,
        html,
      }),
    ),
  );
}
