"use client";

import { FOUNDING_TEKST } from "@/lib/founding-fase";

type Tab = "profiel" | "stelsel" | "opdrachtgever";

export type FoundingStap = {
  tab: Tab;
  label: string;
  /** Kort wat er nog ontbreekt, alleen getoond als de stap open staat. */
  hint?: string;
  klaar: boolean;
};

/**
 * Founding-balk bovenaan de accountpagina: legt uit dat er nog geen missies
 * zijn en toont een afvinklijst van wat een ster nu al kan doen. Klaar =
 * vinkje; open = klikbaar naar de juiste tab.
 */
export default function FoundingBalk({
  stappen,
  naarTab,
}: {
  stappen: FoundingStap[];
  naarTab: (tab: Tab) => void;
}) {
  const klaar = stappen.filter((s) => s.klaar).length;
  const alles = klaar === stappen.length;

  return (
    <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/5 p-5 sm:p-6">
      <p className="label text-accent">Founding · de eerste 100 sterren</p>
      <p className="mt-2 text-tekst-secundair">{FOUNDING_TEKST.lang}</p>

      <div className="mt-5 flex items-baseline justify-between gap-4">
        <p className="font-semibold">{FOUNDING_TEKST.nuDoen}</p>
        <p className="tekst-klein text-tekst-secundair">
          {klaar} van {stappen.length}
        </p>
      </div>

      <ul className="mt-3 divide-y divide-lijn/60">
        {stappen.map((s) => (
          <li key={s.tab}>
            {s.klaar ? (
              <div className="flex items-center gap-3 py-3 text-tekst-secundair">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-succes/15 text-succes"
                >
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10.5l4 4 8-9" />
                  </svg>
                </span>
                <span className="line-through decoration-tekst-secundair/50">{s.label}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => naarTab(s.tab)}
                className="group flex w-full items-center gap-3 py-3 text-left transition-colors duration-200 hover:text-accent"
              >
                <span
                  aria-hidden="true"
                  className="h-6 w-6 shrink-0 rounded-full border-2 border-lijn transition-colors duration-200 group-hover:border-accent"
                />
                <span className="flex-1">
                  <span className="font-semibold">{s.label}</span>
                  {s.hint && (
                    <span className="ml-2 tekst-klein text-tekst-secundair">{s.hint}</span>
                  )}
                </span>
              </button>
            )}
          </li>
        ))}
      </ul>

      {alles && (
        <p className="mt-4 text-succes">
          Alles staat klaar. Zodra de eerste missie live gaat, hoor jij het als eerste.
        </p>
      )}
    </div>
  );
}
