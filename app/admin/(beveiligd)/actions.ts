"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseService } from "@/lib/supabase";
import { getAdminStatus } from "@/lib/admin";
import { stuurMail, emailHtml, esc } from "@/lib/mail";
import type { AdminReactie } from "@/lib/admin-data";

async function huidigeOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "https://uxstars.vercel.app";
}

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

  // Trigger: seintje naar beschikbare sterren die qua seniority passen.
  await meldPassendeMissie(id);
}

/**
 * Mailt beschikbare sterren met een account dat qua seniority bij de missie
 * past ("een missie die bij je past licht op"). Leest de privé-mailadressen via
 * de service-role; faalt stil (notificatie, geen blokkade).
 */
async function meldPassendeMissie(missieId: string): Promise<void> {
  const svc = getSupabaseService();
  if (!svc) return;

  const { data: m } = await svc
    .from("missies")
    .select("titel, slug, seniority")
    .eq("id", missieId)
    .single();
  if (!m) return;

  let q = svc
    .from("stars")
    .select("naam, email, seniority")
    .eq("beschikbaar", true)
    .eq("status", "actief")
    .not("user_id", "is", null)
    .not("email", "is", null);
  if (m.seniority) q = q.eq("seniority", m.seniority);

  const { data: sterren } = await q;
  if (!sterren || sterren.length === 0) return;

  const origin = await huidigeOrigin();
  const link = `${origin}/missies/${m.slug}`;

  await Promise.all(
    sterren
      .filter((s) => s.email)
      .map((s) =>
        stuurMail({
          naar: s.email as string,
          onderwerp: `Een missie die bij je past: ${m.titel}`,
          html: emailHtml({
            voorkop: "Nieuwe missie",
            kop: "Een missie die bij je past",
            alineas: [
              `Hoi ${esc((s.naam ?? "").split(" ")[0])}, er is een nieuwe missie in het stelsel die past bij jouw niveau: <strong style="color:#0a0e1a;">${esc(m.titel)}</strong>.`,
              "Beschikbaar en interesse? Bekijk de missie en laat van je horen.",
            ],
            knop: { label: "Bekijk de missie", url: link },
          }),
        }),
      ),
  );
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

/**
 * Verwijdert een account volledig (auth-user + gekoppelde ster/bedrijf en hun
 * afhankelijke rijen). Voor het opschonen van test-accounts. Beveiligd: niet je
 * eigen account, en geen admin-accounts.
 */
export async function verwijderAccount(
  userId: string,
): Promise<{ ok: boolean; fout?: string }> {
  const { isAdmin, user } = await getAdminStatus();
  if (!isAdmin) return { ok: false };
  if (user?.id === userId)
    return { ok: false, fout: "Je eigen account kun je hier niet verwijderen" };

  const svc = getSupabaseService();
  if (!svc) return { ok: false };

  // Geen admin-accounts verwijderen.
  const { data: udata } = await svc.auth.admin.getUserById(userId);
  const email = udata?.user?.email;
  if (email) {
    const { data: adminRow } = await svc
      .from("admins")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (adminRow) return { ok: false, fout: "Admin-account; niet verwijderbaar" };
  }

  // Ster + afhankelijke rijen opruimen.
  const { data: star } = await svc
    .from("stars")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (star) {
    await svc.from("reacties").delete().eq("star_id", star.id);
    await svc.from("plaatsingen").delete().eq("star_id", star.id);
    await svc.from("stars").delete().eq("id", star.id);
  }
  await svc.from("opdrachtgevers").delete().eq("user_id", userId);

  const { error } = await svc.auth.admin.deleteUser(userId);
  if (error) {
    console.error("verwijderAccount:", error.message);
    return { ok: false, fout: error.message };
  }
  revalidatePath("/admin/accounts");
  return { ok: true };
}

/** Admin werkt de status van een opdrachtgever-lead bij. */
export async function zetLeadStatus(
  id: string,
  status: string,
): Promise<{ ok: boolean }> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { error } = await supabase.rpc("zet_lead_status", {
    p_id: id,
    p_status: status,
  });
  if (error) {
    console.error("zet_lead_status:", error.message);
    return { ok: false };
  }
  revalidatePath("/admin/leads");
  return { ok: true };
}

/** Admin werkt de contractstatus van een plaatsing bij. */
export async function zetContractStatus(
  plaatsingId: string,
  status: string,
): Promise<{ ok: boolean }> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { error } = await supabase.rpc("zet_contract_status", {
    p_plaatsing_id: plaatsingId,
    p_status: status,
  });
  if (error) {
    console.error("zet_contract_status:", error.message);
    return { ok: false };
  }
  revalidatePath("/admin/plaatsingen");
  return { ok: true };
}

/** Verwijdert een bedrijf (opdrachtgever). Missies blijven (opdrachtgever wordt null). */
export async function verwijderBedrijf(
  bedrijfId: string,
): Promise<{ ok: boolean }> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const svc = getSupabaseService();
  if (!svc) return { ok: false };

  const { error } = await svc.from("opdrachtgevers").delete().eq("id", bedrijfId);
  if (error) {
    console.error("verwijderBedrijf:", error.message);
    return { ok: false };
  }
  revalidatePath("/admin/bedrijven");
  return { ok: true };
}

/** Admin zet (handmatig) de membership-status van een bedrijf. */
export async function zetMembership(
  bedrijfId: string,
  status: string,
  tier: string,
  tot: string | null,
): Promise<{ ok: boolean }> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { error } = await supabase.rpc("zet_membership", {
    p_bedrijf_id: bedrijfId,
    p_status: status,
    p_tier: tier,
    p_tot: tot,
  });
  if (error) {
    console.error("zet_membership:", error.message);
    return { ok: false };
  }
  revalidatePath("/admin/bedrijven");
  return { ok: true };
}

/** Verwijdert een vouch-aanvraag (opschonen van de kandidatenpool). */
export async function verwijderAanvraag(
  aanvraagId: string,
): Promise<{ ok: boolean }> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { error } = await supabase.rpc("verwijder_vouch_aanvraag", {
    p_id: aanvraagId,
  });
  if (error) {
    console.error("verwijder_vouch_aanvraag:", error.message);
    return { ok: false };
  }
  revalidatePath("/admin/uitnodigingen");
  return { ok: true };
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

  // Trigger A: de ster ook een seintje dat 'ie is voorgesteld.
  if (r.star.email) {
    await stuurMail({
      naar: r.star.email,
      onderwerp: `Je bent voorgesteld voor: ${r.missie_titel}`,
      html: emailHtml({
        voorkop: "Voorgesteld",
        kop: "Je bent voorgesteld",
        alineas: [
          `Goed nieuws, ${esc(r.star.naam.split(" ")[0])} — we hebben je voorgesteld aan de opdrachtgever van <strong style="color:#0a0e1a;">${esc(r.missie_titel)}</strong>.`,
          "Is er een match, dan brengen we jullie in contact. We houden je op de hoogte.",
        ],
      }),
    });
  }

  await supabase.rpc("markeer_voorgesteld", { p_reactie_id: reactieId });
  revalidatePath("/admin/reacties");
  return { ok: true };
}

export async function bevestigPlaatsing(
  reactieId: string,
  dealType: "direct" | "via_uxstars" = "direct",
  sterTarief?: number,
  klantTarief?: number,
): Promise<{ ok: boolean }> {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return { ok: false };

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  // Star-gegevens vooraf ophalen (voor de felicitatie-mail na het plaatsen).
  const { data: reacties } = await supabase.rpc("admin_reacties");
  const r = ((reacties as AdminReactie[] | null) ?? []).find(
    (x) => x.reactie_id === reactieId,
  );

  const { error } = await supabase.rpc("bevestig_plaatsing", {
    p_reactie_id: reactieId,
    p_deal_type: dealType,
    p_ster_tarief: sterTarief,
    p_klant_tarief: klantTarief,
  });
  if (error) {
    console.error("bevestig_plaatsing:", error.message);
    return { ok: false };
  }

  // Trigger B: felicitatie naar de geplaatste ster.
  if (r?.star.email) {
    await stuurMail({
      naar: r.star.email,
      onderwerp: `Je bent geplaatst op: ${r.missie_titel}`,
      html: emailHtml({
        voorkop: "Geplaatst",
        kop: "Gefeliciteerd — je bent geplaatst",
        alineas: [
          `${esc(r.star.naam.split(" ")[0])}, je bent geplaatst op <strong style="color:#0a0e1a;">${esc(r.missie_titel)}</strong>. Mooi werk! ✦`,
          "We nemen contact op over de praktische afspraken.",
        ],
      }),
    });
  }

  revalidatePath("/admin/reacties");
  revalidatePath("/missies");
  revalidatePath("/");
  return { ok: true };
}
