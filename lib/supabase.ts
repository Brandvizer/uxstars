import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Of Supabase is geconfigureerd. Zo niet, dan valt de app terug op mockdata
 * (zie lib/stars.ts) zodat ontwikkelen en de build werken zonder keys.
 */
export const supabaseGeconfigureerd = Boolean(url && anonKey);

/**
 * Client met de anon key — respecteert Row Level Security. Veilig om zowel
 * server-side (server components) als in de browser te gebruiken; leest enkel
 * wat RLS publiek toestaat (open missies, actieve stars zonder tarief/email).
 *
 * Geeft null als Supabase niet is geconfigureerd.
 */
export function getSupabase() {
  if (!supabaseGeconfigureerd) return null;
  return createClient<Database>(url!, anonKey!, {
    auth: { persistSession: false },
  });
}

/**
 * Client met de service-role key — omzeilt Row Level Security. ALLEEN server-side
 * gebruiken (nooit naar de browser sturen). Voor server-side taken die geen
 * ingelogde gebruiker hebben, zoals een admin mailen bij een nieuwe aanvraag.
 *
 * Geeft null als de service-role key niet is geconfigureerd.
 */
export function getSupabaseService() {
  if (!url || !serviceKey) return null;
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });
}
