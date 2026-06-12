"use client";

import type { UseFormReturn } from "react-hook-form";
import KeuzeOpties from "./KeuzeOpties";
import { tariefOpties } from "@/lib/validaties";
import type { MissieFormData } from "@/lib/validaties";

export const stapTariefVelden = ["tarief"] as const;

export default function StapTarief({
  form,
}: {
  form: UseFormReturn<MissieFormData>;
}) {
  return (
    <fieldset>
      <legend className="text-2xl font-semibold sm:text-3xl">
        Welk tarief past bij de missie?
      </legend>
      <p className="mt-2 text-tekst-secundair">
        Een eerlijke indicatie helpt de juiste sterren te reageren. Twijfel je?
        Kies &lsquo;In overleg&rsquo;.
      </p>
      <div className="mt-8">
        <KeuzeOpties
          opties={tariefOpties}
          registratie={form.register("tarief")}
          huidigeWaarde={form.watch("tarief")}
          fout={form.formState.errors.tarief?.message}
        />
      </div>
    </fieldset>
  );
}
