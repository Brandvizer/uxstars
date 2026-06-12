"use client";

import type { UseFormReturn } from "react-hook-form";
import KeuzeOpties from "./KeuzeOpties";
import { startOpties } from "@/lib/validaties";
import type { MissieFormData } from "@/lib/validaties";

export const stapStartVelden = ["start"] as const;

export default function StapStart({
  form,
}: {
  form: UseFormReturn<MissieFormData>;
}) {
  return (
    <fieldset>
      <legend className="text-2xl font-semibold sm:text-3xl">
        Wanneer moet de raket de lucht in?
      </legend>
      <div className="mt-8">
        <KeuzeOpties
          opties={startOpties}
          registratie={form.register("start")}
          huidigeWaarde={form.watch("start")}
          fout={form.formState.errors.start?.message}
        />
      </div>
    </fieldset>
  );
}
