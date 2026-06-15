"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { maakBootstrapUitnodiging } from "@/app/admin/(beveiligd)/actions";

export default function BootstrapInvite() {
  const [url, setUrl] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);
  const [gekopieerd, setGekopieerd] = useState(false);

  const maak = async () => {
    setBezig(true);
    const resultaat = await maakBootstrapUitnodiging();
    setBezig(false);
    if (resultaat.ok && resultaat.token) {
      setUrl(`${window.location.origin}/uitnodiging/${resultaat.token}`);
      setGekopieerd(false);
    }
  };

  return (
    <div>
      <Button type="button" onClick={maak} disabled={bezig}>
        {bezig ? "Bezig…" : "Nieuwe uitnodiging aanmaken"}
      </Button>

      {url && (
        <div className="mt-5 rounded-2xl border border-accent/30 bg-paneel p-5">
          <p className="text-sm text-tekst-secundair">
            Deel deze eenmalige uitnodigingslink met een designer:
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-xl border border-lijn bg-achtergrond px-4 py-3 font-mono text-sm text-tekst"
            />
            <Button
              type="button"
              variant="secundair"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setGekopieerd(true);
                setTimeout(() => setGekopieerd(false), 2000);
              }}
            >
              {gekopieerd ? "Gekopieerd ✓" : "Kopieer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
