"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getAdminStatus } from "@/lib/admin";
import { stuurMail } from "@/lib/mail";
import type { AdminReactie } from "@/lib/admin-data";

export async function uitloggen() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
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

  const html = `
    <p>Een ster uit het UXSTARS-netwerk heeft gereageerd op je missie
      <strong>${r.missie_titel}</strong>.</p>
    <p><strong>${r.star.naam}</strong> — ${r.star.specialisme}, ${r.star.seniority}</p>
    ${r.motivatie ? `<p><em>"${r.motivatie}"</em></p>` : ""}
    ${r.star.portfolio_url ? `<p>Portfolio: <a href="${r.star.portfolio_url}">${r.star.portfolio_url}</a></p>` : ""}
    ${r.star.linkedin_url ? `<p>LinkedIn: <a href="${r.star.linkedin_url}">${r.star.linkedin_url}</a></p>` : ""}
    <p>Wil je kennismaken? Reageer op deze mail, dan brengen we je in contact.</p>
  `;

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
