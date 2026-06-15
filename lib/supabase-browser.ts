import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Supabase-client voor de browser (login-pagina). Gebruikt de PKCE-flow
 * (standaard in @supabase/ssr): signInWithOtp zet een code_verifier-cookie en
 * de magic link komt terug met ?code=, die de server-callback inwisselt.
 */
export function getSupabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
