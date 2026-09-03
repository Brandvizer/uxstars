"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";
import FoundingTeller from "@/components/marketing/FoundingTeller";

type Type = "designer" | "opdrachtgever";

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
      payload: { naam: naam.trim(), email: email.trim(), type: "opdrachtgever" },
    });
    setStatus(error ? "fout" : "klaar");
  };

  const veld =
    "w-full rounded-xl border border-lijn bg-achtergrond/80 px-4 py-3 text-base text-tekst placeholder:text-tekst-secundair/60 focus:border-accent focus:outline-none";

  return (
    <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-lijn bg-paneel/90 p-6 text-left backdrop-blur-sm sm:p-7">
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

      {type === "designer" ? (
        <div className="mt-5">
          <p className="mb-4 text-sm text-tekst-secundair">
            We openen met de eerste 100 sterren. Meld je direct aan met je
            portfolio en claim je plek in het stelsel.
          </p>
          <FoundingTeller metCta />
        </div>
      ) : status === "klaar" ? (
        <div className="mt-5 rounded-xl border border-succes/40 bg-achtergrond/60 p-5 text-center">
          <p className="text-base font-semibold text-succes">Je staat genoteerd</p>
          <p className="mt-2 text-sm text-tekst-secundair">
            We nemen contact op zodra we opengaan voor opdrachtgevers.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-tekst-secundair">
            We gaan binnenkort open voor opdrachtgevers. Laat je e-mail achter, dan
            ben je als eerste aan de beurt.
          </p>
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
              placeholder="jij@bedrijf.nl"
              className={veld}
              autoComplete="email"
            />
            <Button type="submit" disabled={status === "bezig"} className="w-full">
              {status === "bezig" ? "Bezig…" : "Houd me op de hoogte"}
            </Button>
            {status === "fout" && (
              <p className="text-sm text-accent-actief" role="alert">
                Er ging iets mis. Controleer je e-mailadres en probeer het opnieuw.
              </p>
            )}
          </form>
        </>
      )}
    </div>
  );
}
