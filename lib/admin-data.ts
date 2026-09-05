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

export type WachtendeSter = {
  id: string;
  naam: string;
  specialisme: string;
  seniority: string;
  email: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  bio: string | null;
  uitnodiger: string | null;
  created_at: string;
};

export type Aanmelding = {
  id: string;
  naam: string;
  email: string;
  rol: string;
  seniority: string;
  portfolio_url: string | null;
  portfolio_bestand: string | null;
  cv_bestand: string | null;
  motivatie: string | null;
  uitnodiger: string | null;
  created_at: string;
};

export type WachtlijstStatus = "nieuw" | "uitgenodigd" | "benaderd" | "afgewezen";

export type WachtlijstItem = {
  id: string;
  naam: string | null;
  email: string;
  type: "designer" | "opdrachtgever";
  status: WachtlijstStatus;
  uitnodiging_token: string | null;
  created_at: string;
};

/** Pre-launch wachtlijst-aanmeldingen. */
export async function getWachtlijst(): Promise<WachtlijstItem[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_wachtlijst");
  if (error) {
    console.error("getWachtlijst:", error.message);
    return [];
  }
  return (data as WachtlijstItem[] | null) ?? [];
}

export type DashboardStats = {
  wachtlijst: {
    totaal: number;
    designers: number;
    opdrachtgevers: number;
    nieuw: number;
    uitgenodigd: number;
    benaderd: number;
    afgewezen: number;
    laatste7: number;
    laatste30: number;
  };
  reeks: { datum: string; aantal: number }[];
  aanmeldingen: {
    totaal: number;
    nieuw: number;
    goedgekeurd: number;
    afgewezen: number;
  };
  sterren: { actief: number; totaal: number };
  missies: { open: number; totaal: number };
  opdrachtgevers: {
    totaal: number;
    membership_actief: number;
    membership_trial: number;
  };
};

/** Kerncijfers voor het admin-dashboard. */
export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("dashboard_stats");
  if (error) {
    console.error("getDashboardStats:", error.message);
    return null;
  }
  const stats = data as DashboardStats | null;
  return stats && stats.wachtlijst ? stats : null;
}

/** Openstaande aanmeldingen (sollicitaties, nog zonder account). */
export async function getAanmeldingen(): Promise<Aanmelding[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_aanmeldingen");
  if (error) {
    console.error("getAanmeldingen:", error.message);
    return [];
  }
  return (data as Aanmelding[] | null) ?? [];
}

/** Gevouchte aanmeldingen die op admin-goedkeuring wachten (oude flow). */
export async function getWachtendeSterren(): Promise<WachtendeSter[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_wachtende_sterren");
  if (error) {
    console.error("getWachtendeSterren:", error.message);
    return [];
  }
  return (data as WachtendeSter[] | null) ?? [];
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

export type AdminBeloning = {
  id: string;
  kenmerk: string;
  bedrag_cent: number;
  status: "open" | "uitbetaald";
  ster_naam: string;
  ster_email: string | null;
  bedrijf_naam: string;
  created_at: string;
  uitbetaald_op: string | null;
};

export async function getAdminBeloningen(): Promise<AdminBeloning[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_beloningen");
  if (error) {
    console.error("admin_beloningen:", error.message);
    return [];
  }
  return (data as AdminBeloning[] | null) ?? [];
}
