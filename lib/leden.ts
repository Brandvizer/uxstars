import { getSupabase } from "./supabase";

export type Lid = {
  id: string;
  naam: string;
  specialisme: string;
  seniority: string;
  beschikbaar: boolean;
  bio: string | null;
  foto_url: string | null;
  gevouched_door: string | null;
  aantal_vouches_gegeven: number;
};

/** Publieke ledenlijst (actieve sterren) met vouch-afkomst. */
export async function getPubliekeLeden(): Promise<Lid[]> {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db.rpc("publieke_leden");
  if (error) {
    console.error("publieke_leden:", error.message);
    return [];
  }
  return (data as Lid[] | null) ?? [];
}
