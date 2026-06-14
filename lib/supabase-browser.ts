import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Supabase-client voor de browser (login + auth-callback). Deelt de
 * auth-cookies met de server zodat de sessie na de magic link ook server-side
 * (middleware/RLS) beschikbaar is.
 *
 * flowType 'implicit': de magic link levert de sessie in de URL-hash, die de
 * client-side callback uitleest. detectSessionInUrl staat uit zodat de callback
 * dat expliciet en gecontroleerd doet.
 */
export function getSupabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { flowType: "implicit", detectSessionInUrl: false },
    },
  );
}
