import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase-middleware";
import { AANBRENGEN, geldigeAanbrengCode } from "@/lib/aanbrengen";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Aanbrenglink (?via=UXS-XXXX): code bewaren in een cookie, zodat hij de
  // login-omweg (magic link) overleeft en bij registratie gekoppeld wordt.
  const via = geldigeAanbrengCode(request.nextUrl.searchParams.get("via"));
  if (via) {
    response.cookies.set(AANBRENGEN.cookie, via, {
      maxAge: AANBRENGEN.cookieDagen * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

export const config = {
  matcher: [
    // Alles behalve statische assets en afbeeldingen.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
