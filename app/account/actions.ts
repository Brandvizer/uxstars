"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Json } from "@/lib/database.types";

export async function werkProfielBij(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };

  const { error } = await supabase.rpc("werk_profiel_bij", {
    payload: payload as Json,
  });
  if (error) {
    console.error("werk_profiel_bij:", error.message);
    return { ok: false };
  }

  // Profiel + sterrenveld (beschikbaarheid/specialisme) verversen.
  revalidatePath("/account");
  revalidatePath("/");
  return { ok: true };
}

/** Ster beveelt een opdrachtgever aan (lead naar de admin-pool). */
export async function beveelBedrijfAan(
  payload: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false };
  const { error } = await supabase.rpc("beveel_bedrijf_aan", {
    payload: payload as Json,
  });
  if (error) {
    console.error("beveel_bedrijf_aan:", error.message);
    return { ok: false };
  }
  revalidatePath("/account");
  return { ok: true };
}

export async function uitloggenStar() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/account/login");
}
