"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { stuurInloglink } from "@/app/auth/actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Kraslaag from "@/components/ui/Kraslaag";

export default function UitnodigingWelkom({
  token,
  geldig,
  uitnodiger,
  code,
  bedoeldVoor,
}: {
  token: string;
  geldig: boolean;
  uitnodiger: string | null;
  code: string | null;
  bedoeldVoor: string | null;
}) {
  const [fase, setFase] = useState<"kras" | "aanmelden">("kras");
  const [gevalideerd, setGevalideerd] = useState(false);
  const [email, setEmail] = useState(bedoeldVoor ?? "");
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

  const naOnthuld = () => {
    setGevalideerd(true);
    setTimeout(() => setFase("aanmelden"), 1200);
  };

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("bezig");
    localStorage.setItem("uxstars_uitnodiging", token);
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
    <div className="relative mx-auto flex min-h-[85vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <svg
        viewBox="0 0 24 24"
        className="ster-ontvlam relative h-16 w-16 fill-accent"
        aria-hidden="true"
      >
        <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
      </svg>

      {fase === "kras" ? (
        <>
          <p className="relative mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            Je hebt een vouch ontvangen
          </p>
          <h1 className="relative mt-4 !text-[clamp(1.75rem,3vw+1rem,2.75rem)]">
            Kras je plek vrij
          </h1>
          <p className="relative mt-4 text-lg text-tekst-secundair">
            {uitnodiger ? (
              <>
                <span className="text-tekst">{uitnodiger}</span> vouchte jou voor
                UXSTARS.
              </>
            ) : (
              <>Je bent gevouched voor UXSTARS.</>
            )}{" "}
            Kras de kaart hieronder open.
          </p>

          <div className="relative mt-8 w-full max-w-sm">
            <Kraslaag
              hint="Kras je vouch open ✦"
              onthoudSleutel={`uxstars_kras_${token}`}
              onOnthuld={naOnthuld}
            >
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tekst-secundair">
                  Je vouch-code
                </p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-succes">
                  {code ?? "STAR-••••"}
                </p>
                <p className="mt-1 text-sm font-semibold text-succes">✓ geldig</p>
              </div>
            </Kraslaag>
            {gevalideerd && (
              <p className="rijs-in mt-3 text-sm text-succes">
                Geldige vouch — we brengen je verder…
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="rijs-in relative mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            Je vouch is geldig ✦
          </p>
          <h1 className="rijs-in relative mt-4 !text-[clamp(1.75rem,3vw+1rem,2.75rem)]">
            Maak je account aan
          </h1>
          <p className="rijs-in relative mt-4 text-tekst-secundair">
            Nog één stap: maak je account aan met je e-mailadres. Daarna bekijkt
            ons team je aanmelding kort, en hoor je zo snel mogelijk of je erbij
            hoort.
          </p>

          <div className="rijs-in relative mt-8 w-full max-w-sm">
            {status === "verzonden" ? (
              <div className="rounded-2xl border border-succes/40 bg-paneel p-6 text-left">
                <p className="font-semibold text-succes">Check je inbox ✉️</p>
                <p className="mt-2 text-tekst-secundair">
                  We stuurden een link naar{" "}
                  <span className="text-tekst">{email}</span>. Klik erop in
                  dezelfde browser om je aanmelding af te ronden.
                </p>
              </div>
            ) : (
              <form
                onSubmit={verstuur}
                className="space-y-4 rounded-2xl border border-lijn bg-paneel p-6 text-left"
              >
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
                <Button
                  type="submit"
                  disabled={status === "bezig"}
                  className="w-full"
                >
                  {status === "bezig" ? "Bezig…" : "Rond mijn aanmelding af ✦"}
                </Button>
                {status === "fout" && (
                  <p className="text-sm text-accent-actief" role="alert">
                    Er ging iets mis. Controleer het adres en probeer het opnieuw.
                  </p>
                )}
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
