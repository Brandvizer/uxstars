"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import { verstuurVouchNaar } from "@/app/account/actions";

export default function NodigUit() {
  const [naarEmail, setNaarEmail] = useState("");
  const [bericht, setBericht] = useState("");
  const [status, setStatus] = useState<
    "idle" | "bezig" | "verzonden" | "fout"
  >("idle");

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naarEmail.trim()) return;
    setStatus("bezig");
    const r = await verstuurVouchNaar(naarEmail, bericht);
    setStatus(r.ok ? "verzonden" : "fout");
  };

  if (status === "verzonden") {
    return (
      <div className="rounded-2xl border border-succes/40 bg-achtergrond p-5">
        <p className="font-semibold text-succes">Vouch verstuurd</p>
        <p className="mt-1 text-sm text-tekst-secundair">
          <span className="text-tekst">{naarEmail}</span> krijgt je uitnodiging in
          de inbox. Zodra zij zich aanmelden, beoordelen wij het, en hoor jij het
          ook.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setNaarEmail("");
            setBericht("");
          }}
          className="mt-3 text-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-actief"
        >
          Nog iemand uitnodigen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={verstuur} className="space-y-3">
      <Input
        label="E-mailadres van de designer"
        labelVerborgen
        type="email"
        name="vouch-email"
        required
        value={naarEmail}
        onChange={(e) => {
          setNaarEmail(e.target.value);
          if (status === "fout") setStatus("idle");
        }}
        placeholder="naam@voorbeeld.nl"
      />
      <Textarea
        label="Persoonlijk bericht"
        labelVerborgen
        name="vouch-bericht"
        value={bericht}
        onChange={(e) => setBericht(e.target.value)}
        rows={2}
        placeholder="Persoonlijk bericht (optioneel)"
      />
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" disabled={status === "bezig" || !naarEmail.trim()}>
          {status === "bezig" ? "Versturen…" : "Verstuur vouch"}
        </Button>
      </div>
      {status === "fout" && (
        <p className="text-sm text-accent-actief" role="alert">
          Versturen lukte niet. Check het adres en probeer het opnieuw.
        </p>
      )}
    </form>
  );
}
