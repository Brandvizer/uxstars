import { getSupabaseServer } from "@/lib/supabase-server";

export type FoundingStatus = {
  limiet: number;
  bezet: number;
  resterend: number;
  open: boolean;
};

const FALLBACK: FoundingStatus = {
  limiet: 100,
  bezet: 0,
  resterend: 100,
  open: true,
};

/** Server-side founding-status (aantal resterende founding-plekken). */
export async function getFoundingStatus(): Promise<FoundingStatus> {
  const supabase = await getSupabaseServer();
  if (!supabase) return FALLBACK;
  const { data, error } = await supabase.rpc("founding_status");
  if (error || !data) return FALLBACK;
  return data as FoundingStatus;
}
