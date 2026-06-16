"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import {
  zetMembership,
  verwijderBedrijf,
} from "@/app/admin/(beveiligd)/actions";
import type { AdminBedrijf } from "@/lib/admin-data";

const veld =
  "w-full rounded-lg border border-lijn bg-achtergrond px-3 py-2 text-sm text-tekst focus:border-accent focus:outline-none";

function statusBadge(status: string) {
  if (status === "actief") return <Badge kleur="succes">Actief</Badge>;
  if (status === "trial") return <Badge kleur="accent">Trial</Badge>;
  if (status === "verlopen") return <Badge>Verlopen</Badge>;
  return <Badge>Geen</Badge>;
}

function datum(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Kaart({
  bedrijf,
  onWeg,
}: {
  bedrijf: AdminBedrijf;
  onWeg: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(bedrijf.membership_status);
  const [tier, setTier] = useState(bedrijf.membership_tier ?? "");
  const [tot, setTot] = useState(
    bedrijf.membership_tot ? bedrijf.membership_tot.slice(0, 10) : "",
  );
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [bevestigWeg, setBevestigWeg] = useState(false);
  const [wegBezig, setWegBezig] = useState(false);

  const opslaan = async () => {
    setBezig(true);
    setOpgeslagen(false);
    const r = await zetMembership(
      bedrijf.id,
      status,
      tier,
      tot ? new Date(tot).toISOString() : null,
    );
    setBezig(false);
    setOpgeslagen(r.ok);
  };

  const verwijder = async () => {
    setWegBezig(true);
    const r = await verwijderBedrijf(bedrijf.id);
    setWegBezig(false);
    if (r.ok) onWeg(bedrijf.id);
    else setBevestigWeg(false);
  };

  const lopend = status === "actief" || status === "trial";
  const totLabel = datum(bedrijf.membership_tot);

  return (
    <article className="overflow-hidden rounded-2xl border border-lijn bg-paneel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 p-6 text-left transition-colors duration-150 hover:bg-achtergrond/40"
      >
        <div className="min-w-0">
          <h3 className="text-lg">{bedrijf.naam}</h3>
          <p className="mt-1 truncate text-sm text-tekst-secundair">
            {bedrijf.email}
          </p>
          <p className="mt-1 text-xs text-tekst-secundair">
            {bedrijf.heeft_account ? "Account ✓" : "Geen account"} ·{" "}
            {bedrijf.aantal_missies} missie(s)
            {lopend && bedrijf.membership_tier && ` · ${bedrijf.membership_tier}`}
            {lopend && totLabel && ` · tot ${totLabel}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {statusBadge(bedrijf.membership_status)}
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
        <div className="border-t border-lijn px-6 pb-6 pt-5">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {bedrijf.contactpersoon && (
              <div>
                <dt className="text-tekst-secundair">Contactpersoon</dt>
                <dd>{bedrijf.contactpersoon}</dd>
              </div>
            )}
            {bedrijf.website && (
              <div>
                <dt className="text-tekst-secundair">Website</dt>
                <dd>
                  <a
                    href={bedrijf.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:text-accent-actief"
                  >
                    {bedrijf.website}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-tekst-secundair">Aangemaakt</dt>
              <dd>{datum(bedrijf.created_at)}</dd>
            </div>
          </dl>

          <p className="mb-2 mt-6 text-sm font-semibold text-tekst-secundair">
            Membership overschrijven
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-tekst-secundair">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={veld}
              >
                {["geen", "trial", "actief", "verlopen"].map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-tekst-secundair">Pakket</span>
              <input
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                placeholder="partner_jaar"
                className={veld}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-tekst-secundair">Loopt tot</span>
              <input
                type="date"
                value={tot}
                onChange={(e) => setTot(e.target.value)}
                className={veld}
              />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={opslaan}
              disabled={bezig}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-achtergrond transition-colors duration-200 hover:bg-accent-actief disabled:opacity-50"
            >
              {bezig ? "Opslaan…" : "Opslaan"}
            </button>
            {opgeslagen && <span className="text-sm text-succes">Opgeslagen ✓</span>}
          </div>

          <div className="mt-5 flex justify-end border-t border-lijn/60 pt-4 text-sm">
            {!bevestigWeg ? (
              <button
                type="button"
                onClick={() => setBevestigWeg(true)}
                className="text-tekst-secundair transition-colors duration-200 hover:text-red-400"
              >
                Bedrijf verwijderen
              </button>
            ) : (
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={verwijder}
                  disabled={wegBezig}
                  className="rounded-full bg-red-500 px-4 py-1.5 font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:opacity-50"
                >
                  {wegBezig ? "Bezig…" : "Zeker weten?"}
                </button>
                <button
                  type="button"
                  onClick={() => setBevestigWeg(false)}
                  disabled={wegBezig}
                  className="text-tekst-secundair transition-colors duration-200 hover:text-tekst"
                >
                  Annuleren
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function BedrijvenLijst({
  bedrijven,
}: {
  bedrijven: AdminBedrijf[];
}) {
  const [lijst, setLijst] = useState<AdminBedrijf[]>(bedrijven);
  const onWeg = (id: string) =>
    setLijst((l) => l.filter((b) => b.id !== id));

  if (lijst.length === 0) {
    return <p className="text-tekst-secundair">Nog geen bedrijven.</p>;
  }
  return (
    <div className="space-y-4">
      {lijst.map((b) => (
        <Kaart key={b.id} bedrijf={b} onWeg={onWeg} />
      ))}
    </div>
  );
}
