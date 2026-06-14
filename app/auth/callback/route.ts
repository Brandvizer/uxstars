import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

/**
 * Wisselt de code uit de magic link in voor een sessie en stuurt door naar
 * /admin. Vangt fouten af naar de login-pagina.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}/admin`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?fout=1`);
}
