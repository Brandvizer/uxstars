import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Bepaalt waar iemand na het inloggen heen gaat. Eén inlogscherm voor iedereen,
 * drie rollen: admin → missiecontrole (/admin), bedrijf → bedrijfsportaal
 * (/bedrijf), ster → sterportaal (/account). Een expliciete `next` (bijv.
 * /welkom of /bedrijf/welkom) heeft altijd voorrang.
 */
export async function bepaalBestemming(
  supabase: SupabaseClient,
  next: string,
): Promise<string> {
  if (next !== "/account") return next;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return next;

  const { data: adminRij } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();
  if (adminRij) return "/admin";

  const { data: bedrijven } = await supabase.rpc("mijn_bedrijf");
  if (bedrijven && bedrijven.length > 0) return "/bedrijf";

  return next;
}
