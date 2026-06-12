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

const stappen = [
  { Component: StapRol, velden: stapRolVelden },
  { Component: StapMissie, velden: stapMissieVelden },
  { Component: StapOmvang, velden: stapOmvangVelden },
  { Component: StapLocatie, velden: stapLocatieVelden },
  { Component: StapTarief, velden: stapTariefVelden },
  { Component: StapStart, velden: stapStartVelden },
  { Component: StapContact, velden: stapContactVelden },
] as const;

export default function MissieForm() {
  const [stap, setStap] = useState(0);
  const [verzonden, setVerzonden] = useState<MissieFormData | null>(null);

  const form = useForm<MissieFormData>({
    resolver: zodResolver(missieFormSchema),
    mode: "onTouched",
  });

  const laatste = stap === stappen.length - 1;
  const { Component } = stappen[stap];

  const volgende = async () => {
    const geldig = await form.trigger(
      stappen[stap].velden as unknown as (keyof MissieFormData)[],
    );
    if (geldig) setStap((s) => s + 1);
  };

  const verstuur = form.handleSubmit((data) => {
    // Fase 2: opslaan in Supabase (missies, status concept) + mail via Resend
    setVerzonden(data);
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
          >
            ← Vorige
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">
          {laatste ? "Lanceer de missie 🚀" : "Volgende"}
        </Button>
      </div>
    </form>
  );
}
