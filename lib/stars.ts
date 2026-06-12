import { getSupabase, supabaseGeconfigureerd } from "./supabase";
import { sterren as mockSterren } from "./mock-data";
import type { Ster } from "./mock-data";

/**
 * Haalt de actieve sterren + hun vouch-verbindingen op uit Supabase, gemapt
 * naar de Ster-vorm die StarField verwacht. Respecteert RLS (anon key leest
 * alleen status=actief, zonder e-mail/tarief).
 *
 * Valt terug op de mockdata wanneer Supabase niet is geconfigureerd, bij een
 * fout, of zolang de database nog leeg is — zo blijft het sterrenveld altijd
 * gevuld (lokaal ontwikkelen, de build, en vóór het seeden).
 */
export async function getActieveSterren(): Promise<Ster[]> {
  if (!supabaseGeconfigureerd) return mockSterren;

  const db = getSupabase();
  if (!db) return mockSterren;

  const [starsRes, vouchesRes] = await Promise.all([
    db
      .from("stars")
      .select("id, naam, specialisme, seniority, beschikbaar")
      .eq("status", "actief"),
    db.from("vouches").select("van_star_id, naar_star_id"),
  ]);

  if (starsRes.error || vouchesRes.error) {
    console.error(
      "Supabase-fout, terugval op mockdata:",
      starsRes.error?.message ?? vouchesRes.error?.message,
    );
    return mockSterren;
  }

  const rijen = starsRes.data ?? [];
  if (rijen.length === 0) return mockSterren;

  // Vouches groeperen per bron-ster → verbindingen.
  const verbindingenVoor = new Map<string, string[]>();
  for (const v of vouchesRes.data ?? []) {
    const lijst = verbindingenVoor.get(v.van_star_id) ?? [];
    lijst.push(v.naar_star_id);
    verbindingenVoor.set(v.van_star_id, lijst);
  }

  return rijen.map((r) => ({
    id: r.id,
    naam: r.naam,
    specialisme: r.specialisme,
    seniority: r.seniority,
    beschikbaar: r.beschikbaar,
    verbindingen: verbindingenVoor.get(r.id),
  }));
}
