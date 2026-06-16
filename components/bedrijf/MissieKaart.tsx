"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { werkMissieBij } from "@/app/bedrijf/actions";
import type { MijnMissie } from "@/lib/bedrijf-data";
import {
  rollen,
  urenOpties,
  duurOpties,
  tariefOpties,
  startOpties,
} from "@/lib/validaties";

function statusBadge(status: string) {
  if (status === "open") return <Badge kleur="succes">Open · live</Badge>;
  if (status === "gevuld") return <Badge kleur="succes">Gevuld</Badge>;
  if (status === "in_review") return <Badge kleur="accent">In review</Badge>;
  if (status === "gearchiveerd") return <Badge>Gearchiveerd</Badge>;
  return <Badge>{status}</Badge>;
}

const veldKlasse =
  "w-full rounded-xl border border-lijn bg-achtergrond px-4 py-2.5 text-tekst transition-colors duration-200 focus:border-accent focus:outline-none";
const labelKlasse = "mb-1.5 block text-sm font-medium text-tekst-secundair";

/** Keuzelijst die de huidige waarde altijd toont, ook als die buiten de opties valt. */
function Keuze({
  label,
  waarde,
  zet,
  opties,
}: {
  label: string;
  waarde: string;
  zet: (v: string) => void;
  opties: readonly string[];
}) {
  const lijst = waarde && !opties.includes(waarde) ? [waarde, ...opties] : opties;
  return (
    <div>
      <label className={labelKlasse}>{label}</label>
      <select className={veldKlasse} value={waarde} onChange={(e) => zet(e.target.value)}>
        <option value="">—</option>
        {lijst.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function MissieKaart({ missie }: { missie: MijnMissie }) {
  const [open, setOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [fout, setFout] = useState(false);

  const [titel, setTitel] = useState(missie.titel);
  const [rol, setRol] = useState(missie.rol);
  const [locatie, setLocatie] = useState(missie.locatie ?? "");
  const [uren, setUren] = useState(missie.uren_per_week ?? "");
  const [duur, setDuur] = useState(missie.duur ?? "");
  const [tarief, setTarief] = useState(missie.tarief_indicatie ?? "");
  const [start, setStart] = useState(missie.start_indicatie ?? "");
  const [omschrijving, setOmschrijving] = useState(
    (missie.omschrijving ?? []).join("\n\n"),
  );

  const kanBewerken = missie.status !== "gevuld" && missie.status !== "gearchiveerd";
  const datum = new Date(missie.created_at).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const opslaan = async () => {
    setBezig(true);
    setOpgeslagen(false);
    setFout(false);
    const r = await werkMissieBij({
      id: missie.id,
      titel,
      rol,
      locatie,
      uren_per_week: uren,
      duur,
      tarief_indicatie: tarief,
      start_indicatie: start,
      omschrijving,
    });
    setBezig(false);
    if (r.ok) setOpgeslagen(true);
    else setFout(true);
  };

  return (
    <li className="overflow-hidden rounded-2xl border border-lijn bg-paneel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors duration-200 hover:bg-lijn/20"
      >
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{missie.titel}</p>
          <p className="mt-1 text-sm text-tekst-secundair">
            {missie.rol}
            {missie.locatie ? ` · ${missie.locatie}` : ""} · geplaatst {datum}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {statusBadge(missie.status)}
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 text-tekst-secundair transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-lijn p-5">
          {kanBewerken ? (
            <div className="space-y-4">
              <div>
                <label className={labelKlasse}>Titel</label>
                <input
                  className={veldKlasse}
                  value={titel}
                  onChange={(e) => setTitel(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Keuze label="Rol" waarde={rol} zet={setRol} opties={rollen} />
                <div>
                  <label className={labelKlasse}>Locatie</label>
                  <input
                    className={veldKlasse}
                    value={locatie}
                    onChange={(e) => setLocatie(e.target.value)}
                    placeholder="Bijv. Hybride · Amsterdam"
                  />
                </div>
                <Keuze label="Uren per week" waarde={uren} zet={setUren} opties={urenOpties} />
                <Keuze label="Duur" waarde={duur} zet={setDuur} opties={duurOpties} />
                <Keuze label="Tarief" waarde={tarief} zet={setTarief} opties={tariefOpties} />
                <Keuze label="Start" waarde={start} zet={setStart} opties={startOpties} />
              </div>

              <div>
                <label className={labelKlasse}>Omschrijving</label>
                <textarea
                  className={`${veldKlasse} min-h-32 resize-y`}
                  value={omschrijving}
                  onChange={(e) => setOmschrijving(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Button onClick={opslaan} size="sm" disabled={bezig}>
                  {bezig ? "Opslaan…" : "Wijzigingen opslaan"}
                </Button>
                {opgeslagen && (
                  <span className="text-sm text-succes">Opgeslagen ✓</span>
                )}
                {fout && (
                  <span className="text-sm text-accent-actief">
                    Er ging iets mis. Probeer het opnieuw.
                  </span>
                )}
                {missie.status === "open" && (
                  <a
                    href={`/missies/${missie.slug}`}
                    className="ml-auto text-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-actief"
                  >
                    Bekijk live →
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-tekst-secundair">
              Deze missie is {missie.status} en kan niet meer worden aangepast.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
