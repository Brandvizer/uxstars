import { sterren } from "@/lib/mock-data";
import type { Ster } from "@/lib/mock-data";

/**
 * Levert de sterren voor het veld. Fase 1: mock data (51 sterren).
 * Fase 2: vervangen door een Supabase-query op stars (status actief),
 * met dezelfde return-vorm zodat StarField niet wijzigt.
 */
export function useStarData(): { sterren: Ster[] } {
  return { sterren };
}
