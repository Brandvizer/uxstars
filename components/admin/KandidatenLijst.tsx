"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import {
  nodigKandidaatUit,
  wijsKandidaatAf,
} from "@/app/admin/(beveiligd)/actions";
import type { VouchAanvraag } from "@/lib/admin-data";

function Kaart({ aanvraag }: { aanvraag: VouchAanvraag }) {
  const [bezig, setBezig] = useState<"" | "uitnodigen" | "afwijzen">("");
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState(aanvraag.status);
  const [melding, setMelding] = useState<string | null>(null);

  const uitnodigen = async () => {
    setBezig("uitnodigen");
    const r = await nodigKandidaatUit(aanvraag.id, window.location.origin);
    setBezig("");
    if (r.ok) {
      setStatus("uitgenodigd");
      setLink(r.link ?? null);
      setMelding(r.gemaild ? "Uitnodiging gemaild ✓" : "Invite gemaakt (mail vereist RESEND_API_KEY)");
    } else {
      setMelding("Mislukt");
    }
  };

  const afwijzen = async () => {
    setBezig("afwijzen");
    const r = await wijsKandidaatAf(aanvraag.id);
    setBezig("");
    if (r.ok) setStatus("afgewezen");
  };

  return (
    <article className="rounded-2xl border border-lijn bg-paneel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg">{aanvraag.naam}</h3>
          <p className="mt-1 text-sm text-tekst-secundair">{aanvraag.email}</p>
        </div>
        {status === "uitgenodigd" && <Badge kleur="accent">Uitgenodigd</Badge>}
        {status === "afgewezen" && <Badge>Afgewezen</Badge>}
      </div>

      {aanvraag.motivatie && (
        <p className="mt-3 text-tekst-secundair">&ldquo;{aanvraag.motivatie}&rdquo;</p>
      )}
      {aanvraag.portfolio_url && (
        <a
          href={aanvraag.portfolio_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-accent hover:text-accent-actief"
        >
          Portfolio →
        </a>
      )}

      {status === "nieuw" && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={uitnodigen}
            disabled={bezig !== ""}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-achtergrond transition-colors duration-200 hover:bg-accent-actief disabled:opacity-50"
          >
            {bezig === "uitnodigen" ? "Bezig…" : "Vouch geven (uitnodigen)"}
          </button>
          <button
            type="button"
            onClick={afwijzen}
            disabled={bezig !== ""}
            className="rounded-full border border-lijn px-5 py-2.5 text-sm font-semibold text-tekst-secundair transition-colors duration-200 hover:text-tekst disabled:opacity-50"
          >
            Afwijzen
          </button>
        </div>
      )}

      {melding && <p className="mt-3 text-sm text-tekst-secundair">{melding}</p>}
      {link && (
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-2 w-full rounded-xl border border-lijn bg-achtergrond px-4 py-2.5 font-mono text-xs text-tekst"
        />
      )}
    </article>
  );
}

export default function KandidatenLijst({
  aanvragen,
}: {
  aanvragen: VouchAanvraag[];
}) {
  const open = aanvragen.filter((a) => a.status === "nieuw");
  if (aanvragen.length === 0) {
    return (
      <p className="text-tekst-secundair">Nog geen vouch-aanvragen.</p>
    );
  }
  const rest = aanvragen.filter((a) => a.status !== "nieuw");
  return (
    <div className="space-y-4">
      {open.map((a) => (
        <Kaart key={a.id} aanvraag={a} />
      ))}
      {rest.map((a) => (
        <Kaart key={a.id} aanvraag={a} />
      ))}
    </div>
  );
}
