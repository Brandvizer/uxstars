"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import type { MissieFormData } from "@/lib/validaties";

type Voorstel = { titel: string; omschrijving: string; vragen: string[] };
type Status = "idle" | "bezig" | "voorstel" | "fout";

/**
 * "Maak er een missie van": stuurt de ruwe omschrijving (en titel) naar de
 * opschoon-route en zet het resultaat in de velden. Komt er wat terug wat een
 * designer nog mist, dan stelt de AI maximaal twee korte vragen; de antwoorden
 * worden in een tweede ronde verwerkt. De opdrachtgever houdt altijd de keuze:
 * accepteren, antwoorden, of terug naar de eigen tekst.
 */
export default function MissieOpschonen({
  form,
}: {
  form: UseFormReturn<MissieFormData>;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [fout, setFout] = useState<string | null>(null);
  const [voorstel, setVoorstel] = useState<Voorstel | null>(null);
  const [origineel, setOrigineel] = useState<{ titel: string; omschrijving: string } | null>(null);
  const [antwoorden, setAntwoorden] = useState("");
  const [ronde, setRonde] = useState(0);

  const ruw = form.watch("omschrijving") ?? "";
  const genoegWoorden = ruw.trim().split(/\s+/).filter(Boolean).length >= 3;

  const opschonen = async (metAntwoorden?: string) => {
    setStatus("bezig");
    setFout(null);
    const titel = form.getValues("titel") ?? "";
    // Bij een tweede ronde sturen we de oorspronkelijke tekst plus de antwoorden,
    // zodat het model de bron ziet en niet een herschrijving van een herschrijving maakt.
    const bron = metAntwoorden && origineel ? origineel.omschrijving : ruw;
    const bronTitel = metAntwoorden && origineel ? origineel.titel : titel;
    try {
      const r = await fetch("/api/missie/opschonen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          titel: bronTitel,
          omschrijving: bron,
          antwoorden: metAntwoorden ?? "",
        }),
      });
      const data = (await r.json()) as Partial<Voorstel> & { fout?: string };
      if (!r.ok || !data.omschrijving) {
        setFout(data.fout ?? "Opschonen lukte even niet.");
        setStatus("fout");
        return;
      }
      if (!metAntwoorden) setOrigineel({ titel, omschrijving: ruw });
      const nieuw: Voorstel = {
        titel: data.titel ?? "",
        omschrijving: data.omschrijving,
        vragen: data.vragen ?? [],
      };
      setVoorstel(nieuw);
      form.setValue("omschrijving", nieuw.omschrijving, { shouldValidate: true });
      if (!bronTitel && nieuw.titel) {
        form.setValue("titel", nieuw.titel, { shouldValidate: true });
      }
      setAntwoorden("");
      setRonde((n) => n + 1);
      setStatus("voorstel");
    } catch {
      setFout("Opschonen lukte even niet. Check je verbinding.");
      setStatus("fout");
    }
  };

  const terug = () => {
    if (origineel) {
      form.setValue("omschrijving", origineel.omschrijving, { shouldValidate: true });
      form.setValue("titel", origineel.titel, { shouldValidate: true });
    }
    setVoorstel(null);
    setOrigineel(null);
    setAntwoorden("");
    setRonde(0);
    setStatus("idle");
  };

  const klaar = () => {
    setVoorstel(null);
    setStatus("idle");
  };

  if ((status === "voorstel" || status === "bezig") && voorstel) {
    const heeftVragen = voorstel.vragen.length > 0 && ronde < 3;
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 px-4 py-3">
        <p className="tekst-klein text-tekst-secundair">
          We hebben je tekst herschreven
          {origineel && !origineel.titel && voorstel.titel ? " en een titel voorgesteld" : ""}
          . Pas gerust nog aan, of ga terug naar wat je zelf schreef.
        </p>

        {heeftVragen && (
          <div className="mt-4">
            <p className="font-semibold">
              Een designer wil waarschijnlijk nog weten:
            </p>
            <ul className="mt-2 space-y-1.5 text-tekst-secundair">
              {voorstel.vragen.map((v) => (
                <li key={v} className="flex gap-2">
                  <span className="text-accent" aria-hidden="true">?</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Textarea
                label="Je antwoorden"
                labelVerborgen
                name="opschoon-antwoorden"
                rows={2}
                value={antwoorden}
                onChange={(e) => setAntwoorden(e.target.value)}
                placeholder="Beantwoord kort, in je eigen woorden. Mag ook leeg blijven."
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-3">
          {heeftVragen && antwoorden.trim() && (
            <Button
              type="button"
              size="sm"
              onClick={() => opschonen(antwoorden)}
              disabled={status === "bezig"}
            >
              {status === "bezig" ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                  Antwoorden verwerken
                </>
              ) : (
                "Verwerk mijn antwoorden"
              )}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant={heeftVragen && antwoorden.trim() ? "ghost" : "primair"}
            onClick={klaar}
            disabled={status === "bezig"}
          >
            Zo is het goed
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={terug} disabled={status === "bezig"}>
            Terug naar mijn tekst
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Button
        type="button"
        size="sm"
        variant="secundair"
        onClick={() => opschonen()}
        disabled={!genoegWoorden || status === "bezig"}
      >
        {status === "bezig" ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            Bezig met herschrijven
          </>
        ) : (
          "Maak er een missie van"
        )}
      </Button>
      <p className="tekst-klein text-tekst-secundair">
        {fout ??
          "Typ het ruw of plak een vacaturetekst. Wij maken er een heldere missie van."}
      </p>
    </div>
  );
}
