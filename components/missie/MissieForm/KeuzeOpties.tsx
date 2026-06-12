"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

/**
 * Grote aanklikbare keuzekaarten — één vraag, één keuze per scherm.
 */
export default function KeuzeOpties({
  opties,
  registratie,
  huidigeWaarde,
  fout,
}: {
  opties: readonly string[];
  registratie: UseFormRegisterReturn;
  huidigeWaarde?: string;
  fout?: string;
}) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {opties.map((optie) => {
          const gekozen = huidigeWaarde === optie;
          return (
            <label
              key={optie}
              className={`cursor-pointer rounded-xl border px-5 py-4 text-base font-semibold transition-all duration-200 ease-uit ${
                gekozen
                  ? "border-accent bg-accent/10 text-accent-actief"
                  : "border-lijn bg-paneel text-tekst hover:border-tekst-secundair"
              }`}
            >
              <input
                type="radio"
                value={optie}
                className="sr-only"
                {...registratie}
              />
              {optie}
            </label>
          );
        })}
      </div>
      {fout && <p className="mt-3 text-sm text-accent-actief">{fout}</p>}
    </div>
  );
}
