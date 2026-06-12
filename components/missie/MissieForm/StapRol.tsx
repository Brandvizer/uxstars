"use client";

import type { UseFormReturn } from "react-hook-form";
import KeuzeOpties from "./KeuzeOpties";
import { rollen } from "@/lib/validaties";
import type { MissieFormData } from "@/lib/validaties";

export const stapRolVelden = ["rol"] as const;

export default function StapRol({
  form,
}: {
  form: UseFormReturn<MissieFormData>;
}) {
  return (
    <fieldset>
      <legend className="text-2xl font-semibold sm:text-3xl">
        Welke ster zoek je voor deze missie?
      </legend>
      <p className="mt-2 text-tekst-secundair">
        Kies de rol die het dichtst in de buurt komt.
      </p>
      <div className="mt-8">
        <KeuzeOpties
          opties={rollen}
          registratie={form.register("rol")}
          huidigeWaarde={form.watch("rol")}
          fout={form.formState.errors.rol?.message}
        />
      </div>
    </fieldset>
  );
}
