"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { stuurInloglink } from "@/app/auth/actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const VOORDELEN = [
  { titel: "Exclusieve missies", tekst: "Alleen zichtbaar voor gevouchte designers." },
  { titel: "Je eigen plek", tekst: "Een profiel dat oplicht in het stelsel." },
  { titel: "Eén eigen vouch", tekst: "Haal zelf één designer binnen." },
];

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

  const initiaal = uitnodiger?.trim().charAt(0).toUpperCase() || "✦";

  return (
    <div className="relative mx-auto flex min-h-[85vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      {/* Zachte gouden gloed achter de ster */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      {/* Oplichtende ster */}
      <svg
        viewBox="0 0 24 24"
        className="ster-ontvlam relative h-20 w-20 fill-accent"
        aria-hidden="true"
      >
        <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
      </svg>

      <p
        className="rijs-in relative mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-accent"
        style={{ animationDelay: "0.15s" }}
      >
        Je bent gevouched
      </p>
      <h1
        className="rijs-in relative mt-4 !text-[clamp(2rem,4vw+1rem,3.25rem)]"
        style={{ animationDelay: "0.25s" }}
      >
        Welkom in het stelsel
      </h1>

      {uitnodiger && (
        <div
          className="rijs-in relative mt-6 inline-flex items-center gap-3 rounded-full border border-lijn bg-paneel py-1.5 pl-1.5 pr-5"
          style={{ animationDelay: "0.35s" }}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-actief text-sm font-bold text-achtergrond">
            {initiaal}
          </span>
          <span className="text-sm text-tekst-secundair">
            <span className="font-semibold text-tekst">{uitnodiger}</span> vouchte
            jou
          </span>
        </div>
      )}

      <p
        className="rijs-in relative mt-6 text-lg text-tekst-secundair"
        style={{ animationDelay: "0.45s" }}
      >
        Alleen de beste designers komen binnen — en jij bent er één. Maak je
        account aan; je plek tussen de sterren staat klaar.
      </p>

      {/* Wat je krijgt */}
      <ul
        className="rijs-in relative mt-9 grid w-full gap-3 sm:grid-cols-3"
        style={{ animationDelay: "0.55s" }}
      >
        {VOORDELEN.map((v) => (
          <li
            key={v.titel}
            className="rounded-2xl border border-lijn bg-paneel/60 p-4 text-left"
          >
            <span className="text-accent" aria-hidden="true">
              ✦
            </span>
            <p className="mt-2 text-sm font-semibold">{v.titel}</p>
            <p className="mt-1 text-xs leading-relaxed text-tekst-secundair">
              {v.tekst}
            </p>
          </li>
        ))}
      </ul>

      {/* Signup */}
      <div
        className="rijs-in relative mt-10 w-full max-w-sm"
        style={{ animationDelay: "0.65s" }}
      >
        {status === "verzonden" ? (
          <div className="rounded-2xl border border-succes/40 bg-paneel p-6 text-left">
            <p className="font-semibold text-succes">Check je inbox ✉️</p>
            <p className="mt-2 text-tekst-secundair">
              We stuurden een link naar{" "}
              <span className="text-tekst">{email}</span>. Klik erop in dezelfde
              browser om je ster aan te zetten.
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
              {status === "bezig" ? "Bezig…" : "Word een ster ✦"}
            </Button>
            {status === "fout" && (
              <p className="text-sm text-accent-actief" role="alert">
                Er ging iets mis. Controleer het adres en probeer het opnieuw.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
