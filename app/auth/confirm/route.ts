import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase-server";
import { bepaalBestemming } from "@/lib/auth-bestemming";

/**
 * Wisselt een zelf-gegenereerde inloglink (token_hash) in voor een sessie. Dit
 * is de tegenhanger van de ?code=-callback, maar voor mails die wij zelf via
 * Resend versturen (zie app/auth/actions.ts → stuurInloglink). Werkt in elke
 * browser — er is geen PKCE-cookie nodig.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/account";

  if (tokenHash && type) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) {
        const bestemming = await bepaalBestemming(supabase, next);
        return NextResponse.redirect(`${origin}${bestemming}`);
      }
      console.error("verifyOtp:", error.message);
    }
  }

  return NextResponse.redirect(`${origin}/account/login?fout=1`);
}
