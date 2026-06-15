import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Bepaalt waar iemand na het inloggen heen gaat. Eén inlogscherm voor iedereen:
 * staat het adres op de admin-allowlist, dan naar de missiecontrole (/admin);
 * anders naar het sterportaal (/account). Een expliciete `next` (bijv. /welkom)
 * heeft altijd voorrang.
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

  return adminRij ? "/admin" : next;
}
