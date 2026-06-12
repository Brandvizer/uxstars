import { getSupabase, supabaseGeconfigureerd } from "./supabase";
import { missies as mockMissies } from "./mock-data";
import type { Missie } from "./mock-data";
import type { Database } from "./database.types";

type MissieRow = Database["public"]["Tables"]["missies"]["Row"];

// Publiek zichtbare statussen — strookt met de RLS-policy (open + gevuld).
const PUBLIEKE_STATUSSEN = ["open", "gevuld"] as const;

const PUBLIEKE_KOLOMMEN =
  "slug, titel, rol, locatie, uren_per_week, tarief_indicatie, seniority, status, intro, omschrijving, opdrachtgever_label";

// DB-rij (snake_case, nullables) → domeintype Missie dat de componenten verwachten.
function naarMissie(r: Partial<MissieRow>): Missie {
  return {
    slug: r.slug!,
    titel: r.titel!,
    rol: r.rol!,
    locatie: r.locatie ?? "",
    urenPerWeek: r.uren_per_week ?? "",
    tariefIndicatie: r.tarief_indicatie ?? "",
    seniority: r.seniority ?? "",
    status: (r.status === "gevuld" ? "gevuld" : "open"),
    intro: r.intro ?? "",
    omschrijving: r.omschrijving ?? [],
    opdrachtgever: r.opdrachtgever_label ?? "",
  };
}

/**
 * Alle publiek zichtbare missies (open + gevuld), nieuwste eerst.
 * Valt terug op mockdata zonder Supabase, bij een fout, of bij een lege db.
 */
export async function getMissies(): Promise<Missie[]> {
  if (!supabaseGeconfigureerd) return mockMissies;
  const db = getSupabase();
  if (!db) return mockMissies;

  const { data, error } = await db
    .from("missies")
    .select(PUBLIEKE_KOLOMMEN)
    .in("status", PUBLIEKE_STATUSSEN)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase-fout (missies), terugval op mockdata:", error.message);
    return mockMissies;
  }
  if (!data || data.length === 0) return mockMissies;
  return data.map(naarMissie);
}

/**
 * Eén missie op slug, of null als die niet (publiek) bestaat.
 * Zonder Supabase valt het terug op de mockdata.
 */
export async function getMissie(slug: string): Promise<Missie | null> {
  if (!supabaseGeconfigureerd) {
    return mockMissies.find((m) => m.slug === slug) ?? null;
  }
  const db = getSupabase();
  if (!db) return mockMissies.find((m) => m.slug === slug) ?? null;

  const { data, error } = await db
    .from("missies")
    .select(PUBLIEKE_KOLOMMEN)
    .eq("slug", slug)
    .in("status", PUBLIEKE_STATUSSEN)
    .maybeSingle();

  if (error) {
    console.error("Supabase-fout (missie), terugval op mockdata:", error.message);
    return mockMissies.find((m) => m.slug === slug) ?? null;
  }
  return data ? naarMissie(data) : null;
}
