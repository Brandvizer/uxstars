"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import Button from "@/components/ui/Button";
import type { MissieFormData } from "@/lib/validaties";

type Voorstel = { titel: string; omschrijving: string };

/**
 * "Maak er een missie van": stuurt de ruwe omschrijving (en titel) naar de
 * opschoon-route en toont het resultaat als voorstel. De opdrachtgever kiest
 * zelf: overnemen of terug naar de eigen tekst. Nooit stil overschrijven.
 */
export default function MissieOpschonen({
  form,
}: {
  form: UseFormReturn<MissieFormData>;
}) {
  const [status, setStatus] = useState<"idle" | "bezig" | "voorstel" | "fout">(
    "idle",
  );
  const [fout, setFout] = useState<string | null>(null);
  const [voorstel, setVoorstel] = useState<Voorstel | null>(null);
  const [origineel, setOrigineel] = useState<Voorstel | null>(null);

  const ruw = form.watch("omschrijving") ?? "";
  const genoegWoorden = ruw.trim().split(/\s+/).filter(Boolean).length >= 3;

  const opschonen = async () => {
    setStatus("bezig");
    setFout(null);
    const titel = form.getValues("titel") ?? "";
    try {
      const r = await fetch("/api/missie/opschonen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ titel, omschrijving: ruw }),
      });
      const data = (await r.json()) as Partial<Voorstel> & { fout?: string };
      if (!r.ok || !data.omschrijving) {
        setFout(data.fout ?? "Opschonen lukte even niet.");
        setStatus("fout");
        return;
      }
      setOrigineel({ titel, omschrijving: ruw });
      setVoorstel({ titel: data.titel ?? "", omschrijving: data.omschrijving });
      // Voorstel meteen in de velden zetten; "Terug" herstelt het origineel.
      form.setValue("omschrijving", data.omschrijving, { shouldValidate: true });
      if (!titel && data.titel) {
        form.setValue("titel", data.titel, { shouldValidate: true });
      }
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
    setStatus("idle");
  };

  if (status === "voorstel" && voorstel) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 px-4 py-3">
        <p className="tekst-klein text-tekst-secundair">
          We hebben je tekst herschreven
          {voorstel.titel ? " en een titel voorgesteld" : ""}. Pas gerust nog
          aan, of ga terug naar wat je zelf schreef.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button type="button" size="sm" onClick={() => setStatus("idle")}>
            Zo is het goed
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={terug}>
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
        onClick={opschonen}
        disabled={!genoegWoorden || status === "bezig"}
      >
        {status === "bezig" ? "Bezig met herschrijven…" : "Maak er een missie van"}
      </Button>
      <p className="tekst-klein text-tekst-secundair">
        {fout ??
          "Typ het ruw of plak een vacaturetekst. Wij maken er een heldere missie van."}
      </p>
    </div>
  );
}
