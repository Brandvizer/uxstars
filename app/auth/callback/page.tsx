"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/**
 * Client-side auth-callback. De magic link levert de sessie in de URL-hash
 * (#access_token=…), die hier wordt uitgelezen en met setSession in cookies
 * wordt gezet — zodat de middleware en RLS de ingelogde gebruiker zien.
 */
export default function AuthCallback() {
  const router = useRouter();
  const [fout, setFout] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");

    if (!access_token || !refresh_token) {
      setFout(true);
      return;
    }

    const supabase = getSupabaseBrowser();
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) setFout(true);
        else router.replace("/admin");
      });
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 text-center sm:px-6">
      {fout ? (
        <>
          <p className="font-semibold text-accent-actief">Inloggen mislukt</p>
          <p className="mt-2 text-tekst-secundair">
            De link is verlopen of al gebruikt. Vraag een nieuwe inloglink aan.
          </p>
          <a
            href="/admin/login"
            className="mt-6 text-accent transition-colors duration-200 hover:text-accent-actief"
          >
            Terug naar inloggen
          </a>
        </>
      ) : (
        <p className="text-tekst-secundair">Bezig met inloggen…</p>
      )}
    </div>
  );
}
