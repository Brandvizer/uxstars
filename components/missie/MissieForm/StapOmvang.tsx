"use client";

import type { UseFormReturn } from "react-hook-form";
import KeuzeOpties from "./KeuzeOpties";
import { urenOpties, duurOpties } from "@/lib/validaties";
import type { MissieFormData } from "@/lib/validaties";

export const stapOmvangVelden = ["urenPerWeek", "duur"] as const;

export default function StapOmvang({
  form,
}: {
  form: UseFormReturn<MissieFormData>;
}) {
  return (
    <fieldset>
      <legend className="text-2xl font-semibold sm:text-3xl">
        Hoeveel ruimte vraagt de missie?
      </legend>
      <div className="mt-8 space-y-8">
        <div>
          <p className="mb-3 font-semibold">Uren per week</p>
          <KeuzeOpties
            opties={urenOpties}
            registratie={form.register("urenPerWeek")}
            huidigeWaarde={form.watch("urenPerWeek")}
            fout={form.formState.errors.urenPerWeek?.message}
          />
        </div>
        <div>
          <p className="mb-3 font-semibold">Verwachte duur</p>
          <KeuzeOpties
            opties={duurOpties}
            registratie={form.register("duur")}
            huidigeWaarde={form.watch("duur")}
            fout={form.formState.errors.duur?.message}
          />
        </div>
      </div>
    </fieldset>
  );
}
