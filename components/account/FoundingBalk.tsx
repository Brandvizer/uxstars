"use client";

import { FOUNDING_TEKST } from "@/lib/founding-fase";

/**
 * Rustige balk bovenaan de accountpagina in de founding-fase: legt uit dat er
 * nog geen missies zijn en wijst op drie dingen die een ster nu al kan doen.
 */
export default function FoundingBalk({
  naarTab,
}: {
  naarTab: (tab: "profiel" | "stelsel" | "opdrachtgever") => void;
}) {
  const acties: { label: string; tab: "profiel" | "stelsel" | "opdrachtgever" }[] = [
    { label: "Maak je profiel compleet", tab: "profiel" },
    { label: "Geef je vouch weg", tab: "stelsel" },
    { label: "Breng een opdrachtgever binnen", tab: "opdrachtgever" },
  ];
  return (
    <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/5 p-5 sm:p-6">
      <p className="label text-accent">Founding · de eerste 100 sterren</p>
      <p className="mt-2 text-tekst-secundair">{FOUNDING_TEKST.lang}</p>
      <p className="mt-4 font-semibold">{FOUNDING_TEKST.nuDoen}</p>
      <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
        {acties.map((a) => (
          <li key={a.tab}>
            <button
              type="button"
              onClick={() => naarTab(a.tab)}
              className="font-semibold text-accent underline-offset-4 transition-colors duration-200 hover:text-accent-actief hover:underline"
            >
              {a.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
