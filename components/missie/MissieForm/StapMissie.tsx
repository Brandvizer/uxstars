"use client";

import type { UseFormReturn } from "react-hook-form";
import Input, { Textarea } from "@/components/ui/Input";
import MissieOpschonen from "./MissieOpschonen";
import type { MissieFormData } from "@/lib/validaties";

export const stapMissieVelden = ["titel", "omschrijving"] as const;

export default function StapMissie({
  form,
}: {
  form: UseFormReturn<MissieFormData>;
}) {
  return (
    <fieldset>
      <legend className="kop-2">
        Wat is de missie?
      </legend>
      <p className="mt-2 text-tekst-secundair">
        Een goede titel en een korte omschrijving zijn genoeg, wij denken mee
        over de rest.
      </p>
      <div className="mt-8 space-y-6">
        <Input
          label="Titel van de missie"
          placeholder="Bijv. Herontwerp van onze klantomgeving"
          fout={form.formState.errors.titel?.message}
          {...form.register("titel")}
        />
        <div>
          <Textarea
            label="Waar gaat het over?"
            placeholder="Het probleem, het team en wat er over een half jaar moet staan."
            fout={form.formState.errors.omschrijving?.message}
            {...form.register("omschrijving")}
          />
          <div className="mt-3">
            <MissieOpschonen form={form} />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
