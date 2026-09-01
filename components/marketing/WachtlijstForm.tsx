"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";

type Type = "designer" | "opdrachtgever";

const MICRO: Record<Type, string> = {
  designer:
    "Als een van de eerste sterren krijg je vroege toegang tot het stelsel, plus je eigen vouch om iemand mee te nemen.",
  opdrachtgever:
    "Wees er als eerste bij om binnen dagen een gevouchte UX-designer aan je missie te koppelen.",
};

export default function WachtlijstForm() {
  const [type, setType] = useState<Type>("designer");
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "bezig" | "klaar" | "fout">(
    "idle",
  );

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("bezig");
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.rpc("meld_wachtlijst_aan", {
      payload: { naam: naam.trim(), email: email.trim(), type },
    });
    setStatus(error ? "fout" : "klaar");
  };

  if (status === "klaar") {
    return (
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-succes/40 bg-paneel/80 p-7 text-center backdrop-blur-sm">
        <svg
          viewBox="0 0 24 24"
          className="ster-ontvlam mx-auto h-12 w-12 fill-accent"
          aria-hidden="true"
        >
          <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
        </svg>
        <p className="mt-4 text-lg font-semibold text-succes">Je staat op de lijst ✦</p>
        <p className="mt-2 text-tekst-secundair">
          We laten van ons horen zodra het stelsel opengaat. Tot snel tussen de
          sterren.
        </p>
      </div>
    );
  }

  const veld =
    "w-full rounded-xl border border-lijn bg-achtergrond/80 px-4 py-3 text-base text-tekst placeholder:text-tekst-secundair/60 focus:border-accent focus:outline-none";

  return (
    <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-lijn bg-paneel/70 p-6 text-left backdrop-blur-sm sm:p-7">
      <div className="inline-flex w-full rounded-full border border-lijn p-1">
        {(["designer", "opdrachtgever"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              type === t
                ? "bg-accent text-achtergrond"
                : "text-tekst-secundair hover:text-tekst"
            }`}
          >
            {t === "designer" ? "Ik ben designer" : "Ik ben opdrachtgever"}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-tekst-secundair">{MICRO[type]}</p>

      <form onSubmit={verstuur} className="mt-4 space-y-3">
        <input
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Naam (optioneel)"
          className={veld}
          autoComplete="name"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "fout") setStatus("idle");
          }}
          placeholder="jij@voorbeeld.nl"
          className={veld}
          autoComplete="email"
        />
        <Button type="submit" disabled={status === "bezig"} className="w-full">
          {status === "bezig" ? "Bezig…" : "Zet me op de lijst ✦"}
        </Button>
        {status === "fout" && (
          <p className="text-sm text-accent-actief" role="alert">
            Er ging iets mis. Controleer je e-mailadres en probeer het opnieuw.
          </p>
        )}
      </form>
      <p className="mt-3 text-center text-xs text-tekst-secundair">
        Geen spam. Alleen bericht als het stelsel opengaat.
      </p>
    </div>
  );
}
