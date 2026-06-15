"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getAdminStatus } from "@/lib/admin";
import { stuurMail, emailHtml, esc } from "@/lib/mail";
import type { AdminReactie } from "@/lib/admin-data";

export async function uitloggen() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/account/login");
}

/**
 * Keurt een missie goed: status in_review → open (publiek zichtbaar).
 * Dubbele beveiliging: controleert de admin-status server-side; de RLS
 * dwingt het daarnaast af.
 */
export async function keurMissieGoed(id: string) {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return;

  const supabase = await getSupabaseServer();
  if (!supabase) return;

  await supabase
    .from("missies")
    .update({ status: "open" })
    .eq("id", id)
    .eq("status", "in_review");

  // Ververs de admin-lijst én de publieke pagina's waar de missie nu opduikt.
  revalidatePath("/admin");
  revalidatePath("/missies");
  revalidatePath("/");
}

/**
 * Maakt een bootstrap-uitnodiging (zonder uitgevende ster) voor de eerste
 * designers. Geeft het token terug om er een uitnodigingslink van te maken.
 */
export async function maakBootstrapUitnodiging(): Promise<{
  ok: boolean;
  token?: string;
}> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { data, error } = await supabase.rpc("maak_bootstrap_uitnodiging");
  if (error) {
    console.error("maak_bootstrap_uitnodiging:", error.message);
    return { ok: false };
  }
  return { ok: true, token: data };
}

/**
 * Nodigt een kandidaat uit de pool uit: maakt een invite, mailt de
 * uitnodigingslink (via Resend), en geeft de link terug om eventueel zelf te
 * delen. Mailt het niet als RESEND_API_KEY ontbreekt — de link blijft bruikbaar.
 */
export async function nodigKandidaatUit(
  aanvraagId: string,
  origin: string,
): Promise<{ ok: boolean; link?: string; gemaild?: boolean }> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { data, error } = await supabase.rpc("nodig_kandidaat_uit", {
    p_aanvraag_id: aanvraagId,
  });
  if (error) {
    console.error("nodig_kandidaat_uit:", error.message);
    return { ok: false };
  }

  const res = data as { token: string; email: string; naam: string };
  const link = `${origin}/uitnodiging/${res.token}`;

  const mail = await stuurMail({
    naar: res.email,
    onderwerp: "Je bent gevouched voor UXSTARS",
    html: emailHtml({
      voorkop: "Je bent gevouched",
      kop: "Welkom in het stelsel",
      alineas: [
        `Hoi ${esc(res.naam)},`,
        "Je bent uitgenodigd voor UXSTARS — het invite-only netwerk van gevouchte designers. Alleen de beste designers krijgen toegang, en iemand vond dat jij eruit springt.",
        "Deze uitnodiging is eenmalig en persoonlijk.",
      ],
      knop: { label: "Maak je ster aan", url: link },
    }),
  });

  revalidatePath("/admin/uitnodigingen");
  return { ok: true, link, gemaild: mail.ok };
}

export async function wijsKandidaatAf(
  aanvraagId: string,
): Promise<{ ok: boolean }> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { error } = await supabase.rpc("wijs_kandidaat_af", {
    p_aanvraag_id: aanvraagId,
  });
  if (error) {
    console.error("wijs_kandidaat_af:", error.message);
    return { ok: false };
  }
  revalidatePath("/admin/uitnodigingen");
  return { ok: true };
}

/**
 * Stelt de ster van een reactie voor aan de opdrachtgever: mailt het
 * starprofiel + de motivatie, en markeert de reactie als voorgesteld.
 * Haalt de gegevens server-side opnieuw op (vertrouwt niet op de client).
 */
export async function stelVoor(
  reactieId: string,
): Promise<{ ok: boolean; fout?: string }> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { data } = await supabase.rpc("admin_reacties");
  const lijst = (data as AdminReactie[] | null) ?? [];
  const r = lijst.find((x) => x.reactie_id === reactieId);
  if (!r) return { ok: false, fout: "Reactie niet gevonden" };
  if (!r.opdrachtgever_email)
    return { ok: false, fout: "Geen e-mailadres van de opdrachtgever" };

  const html = emailHtml({
    voorkop: "Een ster reageerde",
    kop: `Een ster voor "${esc(r.missie_titel)}"`,
    alineas: [
      `<strong style="color:#0a0e1a;">${esc(r.star.naam)}</strong> — ${esc(r.star.specialisme)}, ${esc(r.star.seniority)}`,
      r.motivatie ? `&ldquo;${esc(r.motivatie)}&rdquo;` : "",
      r.star.portfolio_url
        ? `Portfolio: <a href="${encodeURI(r.star.portfolio_url)}" style="color:#a8740f;font-weight:600;">${esc(r.star.portfolio_url)}</a>`
        : "",
      r.star.linkedin_url
        ? `LinkedIn: <a href="${encodeURI(r.star.linkedin_url)}" style="color:#a8740f;font-weight:600;">bekijk profiel</a>`
        : "",
      "Wil je kennismaken? Reageer op deze mail, dan brengen we je in contact.",
    ],
  });

  const mail = await stuurMail({
    naar: r.opdrachtgever_email,
    onderwerp: `Een ster voor je missie: ${r.missie_titel}`,
    html,
    replyTo: r.star.email ?? undefined,
  });
  if (!mail.ok)
    return { ok: false, fout: "Mail versturen mislukte (Resend-key?)" };

  await supabase.rpc("markeer_voorgesteld", { p_reactie_id: reactieId });
  revalidatePath("/admin/reacties");
  return { ok: true };
}

export async function bevestigPlaatsing(
  reactieId: string,
): Promise<{ ok: boolean }> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { error } = await supabase.rpc("bevestig_plaatsing", {
    p_reactie_id: reactieId,
  });
  if (error) {
    console.error("bevestig_plaatsing:", error.message);
    return { ok: false };
  }
  revalidatePath("/admin/reacties");
  revalidatePath("/missies");
  revalidatePath("/");
  return { ok: true };
}
