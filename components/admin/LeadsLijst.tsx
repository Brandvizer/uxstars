"use client";

import { useState } from "react";
import { zetLeadStatus } from "@/app/admin/(beveiligd)/actions";
import type { AdminLead } from "@/lib/admin-data";

const veld =
  "rounded-lg border border-lijn bg-achtergrond px-3 py-2 text-sm text-tekst focus:border-accent focus:outline-none";
const STATUS = ["nieuw", "benaderd", "binnen", "afgewezen"];

function Kaart({ lead }: { lead: AdminLead }) {
  const [status, setStatus] = useState(lead.status);
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);

  const opslaan = async (nieuw: string) => {
    setStatus(nieuw);
    setBezig(true);
    setOpgeslagen(false);
    const r = await zetLeadStatus(lead.id, nieuw);
    setBezig(false);
    setOpgeslagen(r.ok);
  };

  return (
    <article className="rounded-2xl border border-lijn bg-paneel p-6">
      <h3 className="text-lg">{lead.bedrijf_naam}</h3>
      <p className="mt-1 text-sm text-tekst-secundair">
        {lead.contact_naam && `${lead.contact_naam} · `}
        {lead.contact_email ?? "geen e-mail"}
      </p>
      {lead.ster_naam && (
        <p className="mt-1 text-xs text-tekst-secundair">
          Aangebracht door {lead.ster_naam}
        </p>
      )}
      {lead.toelichting && (
        <p className="mt-3 text-tekst-secundair">&ldquo;{lead.toelichting}&rdquo;</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="text-sm text-tekst-secundair">Status</span>
        <select
          value={status}
          onChange={(e) => opslaan(e.target.value)}
          disabled={bezig}
          className={veld}
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {opgeslagen && <span className="text-sm text-succes">Opgeslagen ✓</span>}
        {lead.contact_email && (
          <a
            href={`mailto:${lead.contact_email}`}
            className="text-sm text-accent hover:text-accent-actief"
          >
            Mail →
          </a>
        )}
      </div>
    </article>
  );
}

export default function LeadsLijst({ leads }: { leads: AdminLead[] }) {
  if (leads.length === 0) {
    return (
      <p className="text-tekst-secundair">Nog geen aanbevolen opdrachtgevers.</p>
    );
  }
  return (
    <div className="space-y-4">
      {leads.map((l) => (
        <Kaart key={l.id} lead={l} />
      ))}
    </div>
  );
}
