"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { keurSterGoed, wijsSterAf } from "@/app/admin/(beveiligd)/actions";
import type { WachtendeSter } from "@/lib/admin-data";

function Kaart({ ster }: { ster: WachtendeSter }) {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);
  const [afwijzen, setAfwijzen] = useState(false);
  const [motivatie, setMotivatie] = useState("");
  const [klaar, setKlaar] = useState<string | null>(null);

  const datum = new Date(ster.created_at).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });

  const goedkeuren = async () => {
    setBezig(true);
    const r = await keurSterGoed(ster.id);
    if (r.ok) {
      setKlaar("Goedgekeurd ✓ welkomstmail verstuurd");
      router.refresh();
    } else setBezig(false);
  };

  const afwijzenNu = async () => {
    setBezig(true);
    const r = await wijsSterAf(ster.id, motivatie);
    if (r.ok) {
      setKlaar("Afgewezen — motivatie gemaild");
      router.refresh();
    } else setBezig(false);
  };

  if (klaar) {
    return (
      <li className="rounded-2xl border border-lijn bg-paneel p-5 text-sm text-tekst-secundair">
        <span className="font-semibold text-tekst">{ster.naam}</span> — {klaar}
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-lijn bg-paneel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">{ster.naam}</p>
          <p className="mt-1 text-sm text-tekst-secundair">
            {ster.specialisme} · {ster.seniority}
            {ster.email ? ` · ${ster.email}` : ""}
          </p>
          <p className="mt-1 text-sm text-tekst-secundair">
            {ster.uitnodiger ? (
              <>
                Gevouched door{" "}
                <span className="text-tekst">{ster.uitnodiger}</span>
              </>
            ) : (
              "Via een bootstrap-uitnodiging"
            )}{" "}
            · aangemeld {datum}
          </p>

          {(ster.portfolio_url || ster.linkedin_url) && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
              {ster.portfolio_url && (
                <a
                  href={ster.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent transition-colors duration-200 hover:text-accent-actief"
                >
                  Portfolio ↗
                </a>
              )}
              {ster.linkedin_url && (
                <a
                  href={ster.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent transition-colors duration-200 hover:text-accent-actief"
                >
                  LinkedIn ↗
                </a>
              )}
            </div>
          )}

          {ster.bio && (
            <p className="mt-3 max-w-2xl whitespace-pre-line rounded-xl border border-lijn bg-achtergrond p-3 text-sm text-tekst-secundair">
              {ster.bio}
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
  aanmeldingen: WachtendeSter[];
}) {
  if (aanmeldingen.length === 0) {
    return (
      <p className="rounded-2xl border border-lijn bg-paneel px-6 py-10 text-center text-tekst-secundair">
        Geen openstaande aanmeldingen. Zodra iemand een vouch inwisselt,
        verschijnt die hier.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {aanmeldingen.map((s) => (
        <Kaart key={s.id} ster={s} />
      ))}
    </ul>
  );
}
