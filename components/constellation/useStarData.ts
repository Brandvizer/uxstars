import { sterren, vouches } from "@/lib/mock-data";
import type { Ster, Vouch } from "@/lib/mock-data";

/**
 * Levert de data voor het sterrenveld. Fase 1: mock data.
 * Fase 2: vervangen door een Supabase-query op stars (status actief)
 * en vouches, met dezelfde return-vorm zodat StarField niet wijzigt.
 */
export function useStarData(): { sterren: Ster[]; vouches: Vouch[] } {
  return { sterren, vouches };
}
