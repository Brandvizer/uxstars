import { getSupabaseServer } from "./supabase-server";

/**
 * Haalt de missies op die op beoordeling wachten (status in_review).
 * Leunt op de admin-RLS-policy; voor een niet-admin geeft de query niets terug.
 */
export async function getReviewMissies() {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("missies")
    .select(
      "id, titel, rol, locatie, uren_per_week, tarief_indicatie, intro, omschrijving, opdrachtgever_label, created_at",
    )
    .eq("status", "in_review")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getReviewMissies:", error.message);
    return [];
  }
  return data ?? [];
}
