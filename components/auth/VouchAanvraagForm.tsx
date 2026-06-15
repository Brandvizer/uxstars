"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";

export default function VouchAanvraagForm() {
  const [status, setStatus] = useState<
    "idle" | "bezig" | "verzonden" | "fout"
  >("idle");

  const verstuur = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("bezig");
    const f = new FormData(e.currentTarget);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.rpc("vraag_vouch_aan", {
      payload: {
        naam: String(f.get("naam") ?? ""),
        email: String(f.get("email") ?? ""),
        portfolio_url: String(f.get("portfolio_url") ?? ""),
        motivatie: String(f.get("motivatie") ?? ""),
      },
    });
    setStatus(error ? "fout" : "verzonden");
  };

  if (status === "verzonden") {
    return (
      <div className="rounded-2xl border border-succes/40 bg-paneel p-8 text-center">
        <p className="text-lg font-semibold text-succes">Je staat op de radar ✦</p>
        <p className="mx-auto mt-3 max-w-md text-tekst-secundair">
          Bedankt. We laten je werk zien aan het stelsel. Vouchen een lid of wij
          jou, dan krijg je een uitnodiging in je inbox.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={verstuur}
      className="rounded-2xl border border-lijn bg-paneel p-6 sm:p-8"
    >
      <h3>Vraag een vouch aan</h3>
      <p className="mt-2 text-tekst-secundair">
        Ken je nog niemand in het stelsel? Zet jezelf op de radar — een lid of
        wij kunnen je vouchen.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Input label="Naam" name="naam" autoComplete="name" required />
        <Input
          label="E-mailadres"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="mt-5">
        <Input
          label="Portfolio of LinkedIn"
          name="portfolio_url"
          type="url"
          placeholder="https://"
        />
      </div>
      <div className="mt-5">
        <Textarea
          label="Vertel kort over je werk (optioneel)"
          name="motivatie"
          placeholder="Wat doe je, en met wie werkte je?"
        />
      </div>
      <div className="mt-6 flex items-center gap-4">
        <Button type="submit" disabled={status === "bezig"}>
          {status === "bezig" ? "Versturen…" : "Vraag een vouch aan"}
        </Button>
        {status === "fout" && (
          <span className="text-sm text-accent-actief">
            Er ging iets mis. Probeer het opnieuw.
          </span>
        )}
      </div>
    </form>
  );
}
