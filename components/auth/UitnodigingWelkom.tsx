"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { stuurInloglink } from "@/app/auth/actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function UitnodigingWelkom({
  token,
  geldig,
  uitnodiger,
}: {
  token: string;
  geldig: boolean;
  uitnodiger: string | null;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "bezig" | "verzonden" | "fout"
  >("idle");

  if (!geldig) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 text-center sm:px-6">
        <h1 className="!text-[clamp(1.5rem,3vw+1rem,2rem)]">
          Uitnodiging niet geldig
        </h1>
        <p className="mt-3 text-tekst-secundair">
          Deze vouch bestaat niet of is al gebruikt. Vraag degene die je
          uitnodigde om een nieuwe — of misschien is het stelsel al rond.
        </p>
      </div>
    );
  }

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("bezig");
    localStorage.setItem("uxstars_uitnodiging", token);

    // Eerst onze eigen Resend; terugvallen op signInWithOtp als er geen key is.
    const eigen = await stuurInloglink(email, "/welkom").catch(() => ({
      ok: false,
      viaResend: false,
    }));
    if (eigen.viaResend) {
      setStatus(eigen.ok ? "verzonden" : "fout");
      return;
    }

    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/welkom` },
    });
    setStatus(error ? "fout" : "verzonden");
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
        Je bent gevouched
      </p>
      <h1 className="mt-4 !text-[clamp(1.75rem,3vw+1rem,2.75rem)]">
        Welkom in het stelsel
      </h1>
      <p className="mt-4 text-lg text-tekst-secundair">
        {uitnodiger ? (
          <>
            <span className="text-tekst">{uitnodiger}</span> staat voor je in en
            geeft jou een plek tussen de sterren.
          </>
        ) : (
          <>Je bent uitgenodigd voor UXSTARS — een netwerk van gevouchte designers.</>
        )}{" "}
        Maak je account aan met je e-mailadres.
      </p>

      {status === "verzonden" ? (
        <div className="mt-8 rounded-2xl border border-succes/40 bg-paneel p-6">
          <p className="font-semibold text-succes">Check je inbox ✉️</p>
          <p className="mt-2 text-tekst-secundair">
            We stuurden een link naar <span className="text-tekst">{email}</span>.
            Klik erop in dezelfde browser om je profiel aan te maken.
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
            {status === "bezig" ? "Bezig…" : "Word een ster"}
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
