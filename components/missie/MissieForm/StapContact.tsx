"use client";

import type { UseFormReturn } from "react-hook-form";
import Input from "@/components/ui/Input";
import type { MissieFormData } from "@/lib/validaties";

export const stapContactVelden = [
  "naam",
  "bedrijf",
  "email",
  "telefoon",
] as const;

export default function StapContact({
  form,
}: {
  form: UseFormReturn<MissieFormData>;
}) {
  return (
    <fieldset>
      <legend className="kop-2">
        Wie mogen we bellen als de juiste ster reageert?
      </legend>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Input
          label="Je naam"
          icoon="persoon"
          placeholder="Voor- en achternaam"
          autoComplete="name"
          fout={form.formState.errors.naam?.message}
          {...form.register("naam")}
        />
        <Input
          label="Organisatie"
          autoComplete="organization"
          fout={form.formState.errors.bedrijf?.message}
          {...form.register("bedrijf")}
        />
        <Input
          label="E-mailadres"
          type="email"
          autoComplete="email"
          fout={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <Input
          label="Telefoon (optioneel)"
          type="tel"
          autoComplete="tel"
          fout={form.formState.errors.telefoon?.message}
          {...form.register("telefoon")}
        />
      </div>
    </fieldset>
  );
}
