"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { zetMembership } from "@/app/admin/(beveiligd)/actions";
import type { AdminBedrijf } from "@/lib/admin-data";

const veld =
  "w-full rounded-xl border border-lijn bg-achtergrond px-3 py-2 text-sm text-tekst focus:border-accent focus:outline-none";

function statusBadge(status: string) {
  if (status === "actief") return <Badge kleur="succes">Actief</Badge>;
  if (status === "trial") return <Badge kleur="accent">Trial</Badge>;
  if (status === "verlopen") return <Badge>Verlopen</Badge>;
  return <Badge>Geen</Badge>;
}

function Kaart({ bedrijf }: { bedrijf: AdminBedrijf }) {
  const [status, setStatus] = useState(bedrijf.membership_status);
  const [tier, setTier] = useState(bedrijf.membership_tier ?? "");
  const [tot, setTot] = useState(
    bedrijf.membership_tot ? bedrijf.membership_tot.slice(0, 10) : "",
  );
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);

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

  return (
    <article className="rounded-2xl border border-lijn bg-paneel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg">{bedrijf.naam}</h3>
          <p className="mt-1 text-sm text-tekst-secundair">{bedrijf.email}</p>
          <p className="mt-1 text-xs text-tekst-secundair">
            {bedrijf.heeft_account ? "Account ✓" : "Geen account"} ·{" "}
            {bedrijf.aantal_missies} missie(s)
          </p>
        </div>
        {statusBadge(bedrijf.membership_status)}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-tekst-secundair">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={veld}
          >
            <option value="geen">Geen</option>
            <option value="trial">Trial</option>
            <option value="actief">Actief</option>
            <option value="verlopen">Verlopen</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-tekst-secundair">Pakket</span>
          <input
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            placeholder="basis"
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

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={opslaan}
          disabled={bezig}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-achtergrond transition-colors duration-200 hover:bg-accent-actief disabled:opacity-50"
        >
          {bezig ? "Opslaan…" : "Membership opslaan"}
        </button>
        {opgeslagen && <span className="text-sm text-succes">Opgeslagen ✓</span>}
      </div>
    </article>
  );
}

export default function BedrijvenLijst({
  bedrijven,
}: {
  bedrijven: AdminBedrijf[];
}) {
  if (bedrijven.length === 0) {
    return <p className="text-tekst-secundair">Nog geen bedrijven.</p>;
  }
  return (
    <div className="space-y-4">
      {bedrijven.map((b) => (
        <Kaart key={b.id} bedrijf={b} />
      ))}
    </div>
  );
}
