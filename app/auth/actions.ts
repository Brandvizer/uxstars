"use server";

import { headers } from "next/headers";
import { getSupabaseService } from "@/lib/supabase";
import { stuurMail, emailHtml, mailGeconfigureerd } from "@/lib/mail";

async function huidigeOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "https://uxstars.vercel.app";
}

/**
 * Verstuurt een inloglink via onze eigen Resend (met de Outlook-proof template),
 * door server-side een magic-link te genereren en zelf te mailen. Zo hebben we
 * volledige controle over het maildocument en zijn we niet afhankelijk van
 * Supabase's e-mailtemplates of SMTP-rate-limits.
 *
 * Geeft { viaResend: false } terug als er geen RESEND_API_KEY is — de client valt
 * dan terug op de gewone signInWithOtp-flow, zodat inloggen altijd blijft werken.
 */
export async function stuurInloglink(
  email: string,
  next: string,
): Promise<{ ok: boolean; viaResend: boolean }> {
  if (!mailGeconfigureerd) return { ok: true, viaResend: false };

  const svc = getSupabaseService();
  if (!svc) return { ok: true, viaResend: false };

  const origin = await huidigeOrigin();
  const veiligeNext = next.startsWith("/") ? next : "/account";

  const { data, error } = await svc.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/auth/confirm` },
  });
  if (error || !data?.properties?.hashed_token) {
    console.error("generateLink:", error?.message ?? "geen token");
    return { ok: false, viaResend: false };
  }

  const { hashed_token, verification_type } = data.properties;
  const link =
    `${origin}/auth/confirm?token_hash=${encodeURIComponent(hashed_token)}` +
    `&type=${encodeURIComponent(verification_type)}` +
    `&next=${encodeURIComponent(veiligeNext)}`;

  const mail = await stuurMail({
    naar: email,
    onderwerp: "Je inloglink voor UXSTARS",
    html: emailHtml({
      voorkop: "Inloggen",
      kop: "Je inloglink",
      alineas: [
        "Klik op de knop om in te loggen bij UXSTARS. Deze link is eenmalig en kort geldig — heb je 'm niet aangevraagd, negeer deze mail dan gerust.",
      ],
      knop: { label: "Log in →", url: link },
    }),
  });

  return { ok: mail.ok, viaResend: true };
}
