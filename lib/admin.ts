import { getSupabaseServer } from "./supabase-server";
import type { User } from "@supabase/supabase-js";

/**
 * Bepaalt de auth-status voor /admin:
 *   • user  — de ingelogde gebruiker (of null)
 *   • isAdmin — of die op de allowlist (admins-tabel) staat
 *
 * De RLS-policy laat een gebruiker enkel zijn eigen admin-rij zien, dus de
 * membership-check is veilig.
 */
export async function getAdminStatus(): Promise<{
  user: User | null;
  isAdmin: boolean;
}> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { user: null, isAdmin: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { user: null, isAdmin: false };

  const { data } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  return { user, isAdmin: Boolean(data) };
}
