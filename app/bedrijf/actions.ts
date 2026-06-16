"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { missieFormSchema } from "@/lib/validaties";
import type { Json } from "@/lib/database.types";

function slugify(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * Plaatst een missie namens het ingelogde bedrijf. De RPC eist een actief
 * membership en gebruikt het bedrijfsaccount (geen losse opdrachtgever).
 */
export async function plaatsMissieAlsBedrijf(
  ruweData: unknown,
): Promise<{ ok: boolean; slug?: string; fout?: string }> {
  const parsed = missieFormSchema.safeParse(ruweData);
  if (!parsed.success) return { ok: false, fout: "validatie" };
  const d = parsed.data;

  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false, fout: "geen-db" };

  const slug = `${slugify(d.titel)}-${crypto.randomUUID().slice(0, 8)}`;
  const locatie =
    d.locatie === "Volledig remote"
      ? "Volledig remote"
      : `${d.locatie} · ${d.plaats ?? ""}`.trim();
  const intro =
    d.omschrijving.length > 180
      ? `${d.omschrijving.slice(0, 180).trimEnd()}…`
      : d.omschrijving;

  const { error } = await supabase.rpc("plaats_missie_als_bedrijf", {
    payload: {
      titel: d.titel,
      rol: d.rol,
      locatie,
      uren_per_week: d.urenPerWeek,
      duur: d.duur,
      tarief_indicatie: d.tarief,
      start_indicatie: d.start,
      intro,
      omschrijving: [d.omschrijving],
      slug,
    } as Json,
  });

  if (error) {
    console.error("plaats_missie_als_bedrijf:", error.message);
    return {
      ok: false,
      fout: error.message.includes("membership") ? "membership" : "opslaan",
    };
  }
  revalidatePath("/bedrijf");
  return { ok: true, slug };
}

/** Maakt (of koppelt) het bedrijfsaccount bij eerste login. Idempotent. */
export async function maakBedrijf(naam: string): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("maak_bedrijf", { p_naam: naam });
  if (error) {
    console.error("maak_bedrijf:", error.message);
    return { ok: false };
  }
  revalidatePath("/bedrijf");
  return { ok: true };
}

export async function werkBedrijfBij(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("werk_bedrijf_bij", {
    payload: payload as Json,
  });
  if (error) {
    console.error("werk_bedrijf_bij:", error.message);
    return { ok: false };
  }
  revalidatePath("/bedrijf");
  return { ok: true };
}

/** Bedrijf start de membership-proefperiode + legt de plankeuze vast. */
export async function startMembershipTrial(
  tier: string,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("start_membership_trial", {
    p_tier: tier,
  });
  if (error) {
    console.error("start_membership_trial:", error.message);
    return { ok: false };
  }
  revalidatePath("/bedrijf");
  return { ok: true };
}

export async function uitloggenBedrijf() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/account/login");
}
