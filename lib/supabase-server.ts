import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Session-aware Supabase-client voor server components, route handlers en
 * server actions. Leest/schrijft de auth-cookies, zodat RLS de ingelogde
 * gebruiker ziet (auth.jwt()). Geeft null als Supabase niet is geconfigureerd.
 */
export async function getSupabaseServer() {
  if (!url || !anonKey) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll vanuit een server component → genegeerd; de middleware
          // ververst de sessie-cookies.
        }
      },
    },
  });
}
