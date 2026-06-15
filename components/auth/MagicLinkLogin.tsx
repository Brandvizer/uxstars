"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

/**
 * Herbruikbaar magic-link-inlogformulier. `next` bepaalt waar je na het
 * inloggen heen gaat (bijv. /admin of /account).
 */
export default function MagicLinkLogin({
  titel,
  intro,
  next,
}: {
  titel: string;
  intro: string;
  next: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "bezig" | "verzonden" | "fout"
  >("idle");

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("bezig");
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setStatus(error ? "fout" : "verzonden");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="!text-[clamp(1.75rem,3vw+1rem,2.5rem)]">{titel}</h1>
      <p className="mt-3 text-tekst-secundair">{intro}</p>

      {status === "verzonden" ? (
        <div className="mt-8 rounded-2xl border border-succes/40 bg-paneel p-6">
          <p className="font-semibold text-succes">Check je inbox ✉️</p>
          <p className="mt-2 text-tekst-secundair">
            We hebben een inloglink gestuurd naar{" "}
            <span className="text-tekst">{email}</span>. Klik erop — in dezelfde
            browser — om verder te gaan.
          </p>
        </div>
      ) : (
        <form onSubmit={verstuur} className="mt-8 space-y-5">
          <Input
            label="E-mailadres"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="jij@voorbeeld.nl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={status === "bezig"} className="w-full">
            {status === "bezig" ? "Bezig…" : "Stuur inloglink"}
          </Button>
          {status === "fout" && (
            <p className="text-sm text-accent-actief" role="alert">
              Er ging iets mis. Controleer het adres en probeer het opnieuw.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
