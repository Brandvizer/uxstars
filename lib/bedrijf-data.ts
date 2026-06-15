import { getSupabaseServer } from "./supabase-server";
import type { Database } from "./database.types";

export type Bedrijf = Database["public"]["Tables"]["opdrachtgevers"]["Row"];

/** Het bedrijf van de ingelogde gebruiker (of null als die geen account heeft). */
export async function getMijnBedrijf(): Promise<Bedrijf | null> {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("mijn_bedrijf");
  if (error) {
    console.error("mijn_bedrijf:", error.message);
    return null;
  }
  return (data as Bedrijf[] | null)?.[0] ?? null;
}

/**
 * Of een membership op dit moment actief is (status 'actief' én niet verlopen).
 * Bepaalt of een bedrijf missies mag plaatsen (gating in 1C).
 */
export function membershipActief(bedrijf: Bedrijf | null): boolean {
  if (!bedrijf || bedrijf.membership_status !== "actief") return false;
  if (!bedrijf.membership_tot) return true;
  return new Date(bedrijf.membership_tot).getTime() > Date.now();
}
