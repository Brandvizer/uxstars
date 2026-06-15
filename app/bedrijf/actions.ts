"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Json } from "@/lib/database.types";

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

export async function uitloggenBedrijf() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/account/login");
}
