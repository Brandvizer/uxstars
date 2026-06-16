"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { zetContractStatus } from "@/app/admin/(beveiligd)/actions";
import type { AdminPlaatsing } from "@/lib/admin-data";

const veld =
  "rounded-lg border border-lijn bg-achtergrond px-3 py-2 text-sm text-tekst focus:border-accent focus:outline-none";

const CONTRACT = ["concept", "getekend", "actief", "afgerond"];

function Kaart({ plaatsing }: { plaatsing: AdminPlaatsing }) {
  const [status, setStatus] = useState(plaatsing.contract_status);
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);
  const via = plaatsing.deal_type === "via_uxstars";

  const opslaan = async (nieuw: string) => {
    setStatus(nieuw);
    setBezig(true);
    setOpgeslagen(false);
    const r = await zetContractStatus(plaatsing.id, nieuw);
    setBezig(false);
    setOpgeslagen(r.ok);
  };

  return (
    <article className="rounded-2xl border border-lijn bg-paneel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg">{plaatsing.missie_titel}</h3>
          <p className="mt-1 text-sm text-tekst-secundair">
            {plaatsing.ster_naam}
            {plaatsing.bedrijf_naam && ` · ${plaatsing.bedrijf_naam}`}
          </p>
        </div>
        <Badge kleur={via ? "accent" : undefined}>
          {via ? "Via UXSTARS" : "Direct"}
        </Badge>
      </div>

      {via && (
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <span className="text-tekst-secundair">
            Ster <span className="text-tekst">€{plaatsing.ster_tarief ?? "—"}/u</span>
          </span>
          <span className="text-tekst-secundair">
            Klant <span className="text-tekst">€{plaatsing.klant_tarief ?? "—"}/u</span>
          </span>
          <span className="text-tekst-secundair">
            Marge{" "}
            <span className="font-semibold text-accent">
              €{plaatsing.marge_uur ?? "—"}/u
            </span>
          </span>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="text-sm text-tekst-secundair">Contractstatus</span>
        <select
          value={status}
          onChange={(e) => opslaan(e.target.value)}
          disabled={bezig}
          className={veld}
        >
          {CONTRACT.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        {opgeslagen && <span className="text-sm text-succes">Opgeslagen ✓</span>}
      </div>
    </article>
  );
}

export default function PlaatsingenLijst({
  plaatsingen,
}: {
  plaatsingen: AdminPlaatsing[];
}) {
  if (plaatsingen.length === 0) {
    return <p className="text-tekst-secundair">Nog geen plaatsingen.</p>;
  }
  return (
    <div className="space-y-4">
      {plaatsingen.map((p) => (
        <Kaart key={p.id} plaatsing={p} />
      ))}
    </div>
  );
}
