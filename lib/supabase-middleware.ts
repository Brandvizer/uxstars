import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Ververst de Supabase-sessie-cookies op elke request (vereist voor
 * @supabase/ssr) en schermt /admin af: niet-ingelogde bezoekers worden naar
 * /admin/login gestuurd. De fijnmazige allowlist-check gebeurt in de
 * admin-layout (die heeft de DB nodig).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Zonder Supabase-config geen auth — laat de request gewoon door.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const beveiligd =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  if (beveiligd && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
