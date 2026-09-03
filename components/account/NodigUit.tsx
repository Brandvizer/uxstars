"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { verstuurVouchNaar } from "@/app/account/actions";

export default function NodigUit({ inviteUrl }: { inviteUrl: string | null }) {
  const [naarEmail, setNaarEmail] = useState("");
  const [bericht, setBericht] = useState("");
  const [status, setStatus] = useState<
    "idle" | "bezig" | "verzonden" | "fout"
  >("idle");
  const [gekopieerd, setGekopieerd] = useState(false);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naarEmail.trim()) return;
    setStatus("bezig");
    const r = await verstuurVouchNaar(naarEmail, bericht);
    setStatus(r.ok ? "verzonden" : "fout");
  };

  const kopieerLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {}
  };

  if (status === "verzonden") {
    return (
      <div className="rounded-2xl border border-succes/40 bg-achtergrond p-5">
        <p className="font-semibold text-succes">Vouch verstuurd ✦</p>
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
          Nog iemand uitnodigen →
        </button>
      </div>
    );
  }

  const veld =
    "w-full rounded-xl border border-lijn bg-achtergrond px-4 py-2.5 text-sm text-tekst placeholder:text-tekst-secundair/60 focus:border-accent focus:outline-none";

  return (
    <form onSubmit={verstuur} className="space-y-3">
      <input
        type="email"
        required
        value={naarEmail}
        onChange={(e) => {
          setNaarEmail(e.target.value);
          if (status === "fout") setStatus("idle");
        }}
        placeholder="naam@voorbeeld.nl"
        className={veld}
      />
      <textarea
        value={bericht}
        onChange={(e) => setBericht(e.target.value)}
        rows={2}
        placeholder="Persoonlijk bericht (optioneel)"
        className={`${veld} resize-y`}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={status === "bezig" || !naarEmail.trim()}>
          {status === "bezig" ? "Versturen…" : "Verstuur vouch ✦"}
        </Button>
        {inviteUrl && (
          <button
            type="button"
            onClick={kopieerLink}
            className="text-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-actief"
          >
            {gekopieerd ? "Link gekopieerd ✓" : "Of kopieer de link"}
          </button>
        )}
      </div>
      {status === "fout" && (
        <p className="text-sm text-accent-actief" role="alert">
          Versturen lukte niet. Check het adres en probeer het opnieuw.
        </p>
      )}
    </form>
  );
}
