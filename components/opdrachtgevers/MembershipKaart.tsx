"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { MEMBERSHIP, euro } from "@/lib/membership";

const voordelen = [
  "Onbeperkt missies plaatsen",
  "Bereik het gevouchte netwerk",
  "Direct contact met je designer",
  `${MEMBERSHIP.trialDagen} dagen gratis proberen`,
];

export default function MembershipKaart() {
  const [ritme, setRitme] = useState<"maand" | "jaar">("jaar");
  const plan = ritme === "jaar" ? MEMBERSHIP.jaar : MEMBERSHIP.maand;

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-start">
        <div className="inline-flex rounded-full border border-lijn p-1">
          {(["maand", "jaar"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRitme(r)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
                ritme === r
                  ? "bg-accent text-achtergrond"
                  : "text-tekst-secundair hover:text-tekst"
              }`}
            >
              {r === "maand" ? "Maandelijks" : "Jaarlijks"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-accent/40 bg-paneel p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">
          {MEMBERSHIP.naam}
        </p>
        <p className="mt-3">
          <span className="text-5xl font-bold">{euro(plan.prijs)}</span>{" "}
          <span className="text-tekst-secundair">{plan.periode}</span>
        </p>
        {ritme === "jaar" && (
          <p className="mt-1 text-sm text-succes">
            ≈ 2 maanden gratis t.o.v. maandelijks
          </p>
        )}

        <ul className="mt-6 space-y-3 text-tekst-secundair">
          {voordelen.map((v) => (
            <li key={v} className="flex items-start gap-3">
              <span className="mt-0.5 text-accent">✦</span>
              {v}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Button href="/bedrijf/login" size="lg" className="w-full">
            Maak een bedrijfsaccount
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-tekst-secundair">
          Geen verplichtingen tijdens de proefperiode.
        </p>
      </div>
    </div>
  );
}
