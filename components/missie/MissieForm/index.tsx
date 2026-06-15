"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/Button";
import Bevestiging from "@/components/missie/Bevestiging";
import RaketVoortgang from "./RaketVoortgang";
import StapRol, { stapRolVelden } from "./StapRol";
import StapMissie, { stapMissieVelden } from "./StapMissie";
import StapOmvang, { stapOmvangVelden } from "./StapOmvang";
import StapLocatie, { stapLocatieVelden } from "./StapLocatie";
import StapTarief, { stapTariefVelden } from "./StapTarief";
import StapStart, { stapStartVelden } from "./StapStart";
import StapContact, { stapContactVelden } from "./StapContact";
import { missieFormSchema } from "@/lib/validaties";
import type { MissieFormData } from "@/lib/validaties";
import { plaatsMissie } from "@/app/missie-plaatsen/actions";
import { plaatsMissieAlsBedrijf } from "@/app/bedrijf/actions";

const alleStappen = [
  { Component: StapRol, velden: stapRolVelden },
  { Component: StapMissie, velden: stapMissieVelden },
  { Component: StapOmvang, velden: stapOmvangVelden },
  { Component: StapLocatie, velden: stapLocatieVelden },
  { Component: StapTarief, velden: stapTariefVelden },
  { Component: StapStart, velden: stapStartVelden },
  { Component: StapContact, velden: stapContactVelden },
] as const;

export default function MissieForm({
  alsBedrijf = false,
  bedrijfNaam = "",
  contactEmail = "",
}: {
  alsBedrijf?: boolean;
  bedrijfNaam?: string;
  contactEmail?: string;
} = {}) {
  // In bedrijfsmodus slaan we de contact-stap over — die gegevens komen uit het
  // ingelogde account.
  const stappen = alsBedrijf ? alleStappen.slice(0, -1) : alleStappen;

  const [stap, setStap] = useState(0);
  const [verzonden, setVerzonden] = useState<MissieFormData | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const form = useForm<MissieFormData>({
    resolver: zodResolver(missieFormSchema),
    mode: "onTouched",
    defaultValues: alsBedrijf
      ? { naam: bedrijfNaam, bedrijf: bedrijfNaam, email: contactEmail }
      : undefined,
  });

  const laatste = stap === stappen.length - 1;
  const { Component } = stappen[stap];

  const volgende = async () => {
    const geldig = await form.trigger(
      stappen[stap].velden as unknown as (keyof MissieFormData)[],
    );
    if (geldig) setStap((s) => s + 1);
  };

  const verstuur = form.handleSubmit(async (data) => {
    setBezig(true);
    setFout(null);
    const resultaat = alsBedrijf
      ? await plaatsMissieAlsBedrijf(data)
      : await plaatsMissie(data);
    setBezig(false);
    if (resultaat.ok) {
      setVerzonden(data);
    } else {
      setFout(
        "Er ging iets mis bij het opslaan. Probeer het zo nog eens, of mail ons op hallo@uxstars.nl.",
      );
    }
  });

  if (verzonden) {
    return <Bevestiging naam={verzonden.naam} />;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (laatste) verstuur();
        else volgende();
      }}
      className="mx-auto max-w-2xl"
    >
      <RaketVoortgang stap={stap} totaal={stappen.length} />

      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-tekst-secundair">
        Stap {stap + 1} van {stappen.length}
      </p>

      <Component form={form} />

      <div className="mt-10 flex items-center justify-between">
        {stap > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStap((s) => s - 1)}
            disabled={bezig}
          >
            ← Vorige
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={bezig}>
          {laatste ? (bezig ? "Bezig met lanceren…" : "Lanceer de missie 🚀") : "Volgende"}
        </Button>
      </div>

      {fout && (
        <p className="mt-4 text-right text-sm text-accent-actief" role="alert">
          {fout}
        </p>
      )}
    </form>
  );
}
