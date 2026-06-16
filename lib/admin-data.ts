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

export type VouchAanvraag = {
  id: string;
  naam: string;
  email: string;
  portfolio_url: string | null;
  motivatie: string | null;
  status: "nieuw" | "uitgenodigd" | "afgewezen";
  created_at: string;
};

export type AdminBedrijf = {
  id: string;
  naam: string;
  email: string;
  contactpersoon: string | null;
  website: string | null;
  membership_status: string;
  membership_tier: string | null;
  membership_tot: string | null;
  heeft_account: boolean;
  aantal_missies: number;
  created_at: string;
};

/** Alle bedrijven met membership-status (voor de admin). */
export async function getAdminBedrijven(): Promise<AdminBedrijf[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_bedrijven");
  if (error) {
    console.error("admin_bedrijven:", error.message);
    return [];
  }
  return (data as AdminBedrijf[] | null) ?? [];
}

export type AdminPlaatsing = {
  id: string;
  missie_titel: string;
  missie_slug: string;
  ster_naam: string;
  bedrijf_naam: string | null;
  deal_type: string;
  ster_tarief: number | null;
  klant_tarief: number | null;
  marge_uur: number | null;
  contract_status: string;
  status: string;
  created_at: string;
};

/** Alle plaatsingen met deal-type, tarieven en contractstatus (voor de admin). */
export async function getAdminPlaatsingen(): Promise<AdminPlaatsing[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_plaatsingen");
  if (error) {
    console.error("admin_plaatsingen:", error.message);
    return [];
  }
  return (data as AdminPlaatsing[] | null) ?? [];
}

export type AdminLead = {
  id: string;
  bedrijf_naam: string;
  contact_naam: string | null;
  contact_email: string | null;
  toelichting: string | null;
  status: string;
  ster_naam: string | null;
  created_at: string;
};

/** Aanbevolen opdrachtgevers (leads) door sterren, voor de admin. */
export async function getAdminBedrijfLeads(): Promise<AdminLead[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_bedrijf_leads");
  if (error) {
    console.error("admin_bedrijf_leads:", error.message);
    return [];
  }
  return (data as AdminLead[] | null) ?? [];
}

/** Vouch-aanvragen (kandidatenpool) voor de admin. */
export async function getVouchAanvragen(): Promise<VouchAanvraag[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_vouch_aanvragen");
  if (error) {
    console.error("getVouchAanvragen:", error.message);
    return [];
  }
  return (data as VouchAanvraag[] | null) ?? [];
}

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
