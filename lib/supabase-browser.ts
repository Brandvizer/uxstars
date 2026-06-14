import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Supabase-client voor de browser (login-pagina). Deelt de auth-cookies met
 * de server zodat de sessie na de magic link beschikbaar is op de server.
 */
export function getSupabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
