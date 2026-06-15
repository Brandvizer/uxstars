import { getSupabaseServer } from "./supabase-server";

export type AdminReactie = {
  reactie_id: string;
  status: string;
  motivatie: string | null;
  created_at: string;
  missie_id: string;
  missie_titel: string;
  missie_status: string;
  opdrachtgever_label: string | null;
  opdrachtgever_email: string | null;
  star: {
    naam: string;
    specialisme: string;
    seniority: string;
    email: string | null;
    portfolio_url: string | null;
    linkedin_url: string | null;
  };
};

/** Alle reacties met ster- en missiedetails (voor de admin). */
export async function getAdminReacties(): Promise<AdminReactie[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_reacties");
  if (error) {
    console.error("getAdminReacties:", error.message);
    return [];
  }
  return (data as AdminReactie[] | null) ?? [];
}

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
