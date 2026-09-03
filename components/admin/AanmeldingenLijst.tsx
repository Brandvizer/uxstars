"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { keurAanmelding, wijsAanmelding } from "@/app/admin/(beveiligd)/actions";
import type { Aanmelding } from "@/lib/admin-data";

function Kaart({ aanmelding }: { aanmelding: Aanmelding }) {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);
  const [afwijzen, setAfwijzen] = useState(false);
  const [motivatie, setMotivatie] = useState("");
  const [klaar, setKlaar] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const datum = new Date(aanmelding.created_at).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });

  const goedkeuren = async () => {
    setBezig(true);
    setFout(null);
    const r = await keurAanmelding(aanmelding.id);
    if (r.ok) {
      setKlaar("Goedgekeurd ✓ account aangemaakt + welkomstmail verstuurd");
      router.refresh();
    } else {
      setBezig(false);
      setFout(r.fout ?? "Er ging iets mis");
    }
  };

  const afwijzenNu = async () => {
    setBezig(true);
    const r = await wijsAanmelding(aanmelding.id, motivatie);
    if (r.ok) {
      setKlaar("Afgewezen, motivatie gemaild");
      router.refresh();
    } else setBezig(false);
  };

  if (klaar) {
    return (
      <li className="rounded-2xl border border-lijn bg-paneel p-5 text-sm text-tekst-secundair">
        <span className="font-semibold text-tekst">{aanmelding.naam}</span> —{" "}
        {klaar}
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-lijn bg-paneel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">{aanmelding.naam}</p>
          <p className="mt-1 text-sm text-tekst-secundair">
            {aanmelding.rol} · {aanmelding.seniority} · {aanmelding.email}
          </p>
          <p className="mt-1 text-sm text-tekst-secundair">
            {aanmelding.uitnodiger ? (
              <>
                Gevouched door{" "}
                <span className="text-tekst">{aanmelding.uitnodiger}</span>
              </>
            ) : (
              "Rechtstreekse aanmelding (zonder vouch van een lid)"
            )}{" "}
            · aangemeld {datum}
          </p>

          <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
            {aanmelding.portfolio_url && (
              <a
                href={aanmelding.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="text-accent transition-colors duration-200 hover:text-accent-actief"
              >
                Portfolio
              </a>
            )}
            {aanmelding.portfolio_bestand && (
              <a
                href={aanmelding.portfolio_bestand}
                target="_blank"
                rel="noreferrer"
                className="text-accent transition-colors duration-200 hover:text-accent-actief"
              >
                Portfolio-PDF
              </a>
            )}
            {aanmelding.cv_bestand && (
              <a
                href={aanmelding.cv_bestand}
                target="_blank"
                rel="noreferrer"
                className="text-accent transition-colors duration-200 hover:text-accent-actief"
              >
                CV
              </a>
            )}
          </div>

          {aanmelding.motivatie && (
            <p className="mt-3 max-w-2xl whitespace-pre-line rounded-xl border border-lijn bg-achtergrond p-3 text-sm text-tekst-secundair">
              {aanmelding.motivatie}
            </p>
          )}
        </div>

        {!afwijzen && (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={goedkeuren} disabled={bezig}>
              {bezig ? "Bezig…" : "Goedkeuren"}
            </Button>
            <button
              type="button"
              onClick={() => setAfwijzen(true)}
              disabled={bezig}
              className="rounded-full border border-lijn bg-achtergrond px-4 py-2 text-sm font-semibold text-tekst-secundair transition-colors duration-200 hover:border-accent-actief hover:text-accent-actief disabled:opacity-50"
            >
              Afwijzen
            </button>
          </div>
        )}
      </div>

      {fout && <p className="mt-3 text-sm text-accent-actief">{fout}</p>}

      {afwijzen && (
        <div className="mt-4 rounded-xl border border-lijn bg-achtergrond p-4">
          <label className="mb-2 block text-sm font-semibold">
            Toelichting voor de kandidaat (nazorg)
          </label>
          <textarea
            value={motivatie}
            onChange={(e) => setMotivatie(e.target.value)}
            rows={3}
            placeholder="Bijv. We zoeken op dit moment vooral naar seniore product designers met een sterk portfolio…"
            className="w-full resize-y rounded-xl border border-lijn bg-paneel px-4 py-2.5 text-sm text-tekst placeholder:text-tekst-secundair/60 focus:border-accent focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={afwijzenNu}
              disabled={bezig}
              className="rounded-full bg-accent-actief px-5 py-2 text-sm font-semibold text-achtergrond transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
            >
              {bezig ? "Versturen…" : "Afwijzen + mail versturen"}
            </button>
            <button
              type="button"
              onClick={() => setAfwijzen(false)}
              disabled={bezig}
              className="text-sm text-tekst-secundair transition-colors duration-200 hover:text-tekst"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function AanmeldingenLijst({
  aanmeldingen,
}: {
  aanmeldingen: Aanmelding[];
}) {
  if (aanmeldingen.length === 0) {
    return (
      <p className="rounded-2xl border border-lijn bg-paneel px-6 py-10 text-center text-tekst-secundair">
        Geen openstaande aanmeldingen. Zodra iemand zich via een vouch aanmeldt,
        verschijnt die hier.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {aanmeldingen.map((a) => (
        <Kaart key={a.id} aanmelding={a} />
      ))}
    </ul>
  );
}
