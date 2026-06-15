import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

/**
 * Auth-callback voor de PKCE-flow (@supabase/ssr). De magic link komt terug met
 * ?code=… ; die wisselen we server-side in voor een sessie (de code_verifier
 * staat in een cookie die de browser-client bij de login zette). Daarna door
 * naar /admin. Fouten gaan terug naar de login-pagina.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const fout = searchParams.get("error");

  if (fout) {
    const omschrijving = searchParams.get("error_description") ?? fout;
    return NextResponse.redirect(
      `${origin}/admin/login?fout=${encodeURIComponent(omschrijving)}`,
    );
  }

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}/admin`);
      console.error("exchangeCodeForSession:", error.message);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?fout=1`);
}
