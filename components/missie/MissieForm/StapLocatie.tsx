"use client";

import type { UseFormReturn } from "react-hook-form";
import KeuzeOpties from "./KeuzeOpties";
import Input from "@/components/ui/Input";
import { locatieOpties } from "@/lib/validaties";
import type { MissieFormData } from "@/lib/validaties";

export const stapLocatieVelden = ["locatie", "plaats"] as const;

export default function StapLocatie({
  form,
}: {
  form: UseFormReturn<MissieFormData>;
}) {
  const locatie = form.watch("locatie");

  return (
    <fieldset>
      <legend className="text-2xl font-semibold sm:text-3xl">
        Waar vindt de missie plaats?
      </legend>
      <div className="mt-8 space-y-6">
        <KeuzeOpties
          opties={locatieOpties}
          registratie={form.register("locatie")}
          huidigeWaarde={locatie}
          fout={form.formState.errors.locatie?.message}
        />
        {locatie && locatie !== "Volledig remote" && (
          <Input
            label="In welke plaats?"
            placeholder="Bijv. Amsterdam"
            fout={form.formState.errors.plaats?.message}
            {...form.register("plaats")}
          />
        )}
      </div>
    </fieldset>
  );
}
