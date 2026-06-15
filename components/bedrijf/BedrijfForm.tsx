"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { werkBedrijfBij, uitloggenBedrijf } from "@/app/bedrijf/actions";
import type { Bedrijf } from "@/lib/bedrijf-data";

const STATUS: Record<string, { tekst: string; klasse: string }> = {
  actief: {
    tekst: "Actief membership",
    klasse: "border-succes/50 bg-succes/5 text-succes",
  },
  trial: {
    tekst: "Trial",
    klasse: "border-accent/50 bg-paneel text-accent",
  },
  verlopen: {
    tekst: "Membership verlopen",
    klasse: "border-lijn bg-paneel text-tekst-secundair",
  },
  geen: {
    tekst: "Geen membership",
    klasse: "border-lijn bg-paneel text-tekst-secundair",
  },
};

export default function BedrijfForm({
  bedrijf,
  email,
  actief,
}: {
  bedrijf: Bedrijf;
  email: string | undefined;
  actief: boolean;
}) {
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);

  const opslaan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBezig(true);
    setOpgeslagen(false);
    const f = new FormData(e.currentTarget);
    const r = await werkBedrijfBij({
      naam: f.get("naam"),
      contactpersoon: f.get("contactpersoon"),
      telefoon: f.get("telefoon"),
      website: f.get("website"),
    });
    setBezig(false);
    setOpgeslagen(r.ok);
  };

  const status = STATUS[bedrijf.membership_status] ?? STATUS.geen;
  const tot = bedrijf.membership_tot
    ? new Date(bedrijf.membership_tot).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="!text-[clamp(1.75rem,3vw+1rem,2.5rem)]">
            {bedrijf.naam}
          </h1>
          <p className="mt-1 text-tekst-secundair">{email}</p>
        </div>
        <form action={uitloggenBedrijf}>
          <button
            type="submit"
            className="text-sm text-tekst-secundair transition-colors duration-200 hover:text-tekst"
          >
            Uitloggen
          </button>
        </form>
      </div>

      {/* Membership */}
      <div className="mt-8 rounded-2xl border border-lijn bg-paneel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Membership</h2>
          <span
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${status.klasse}`}
          >
            {status.tekst}
          </span>
        </div>
        {actief ? (
          <p className="mt-3 text-tekst-secundair">
            Je kunt missies plaatsen in het stelsel.
            {bedrijf.membership_tier && ` Pakket: ${bedrijf.membership_tier}.`}
            {tot && ` Loopt tot ${tot}.`}
          </p>
        ) : (
          <p className="mt-3 text-tekst-secundair">
            Met een actief membership plaats je missies en bereik je het
            gevouchte netwerk. Mail{" "}
            <a
              href="mailto:hallo@uxstars.nl?subject=Membership%20activeren"
              className="font-semibold text-accent hover:text-accent-actief"
            >
              hallo@uxstars.nl
            </a>{" "}
            om te activeren.
          </p>
        )}
      </div>

      {/* Bedrijfsprofiel */}
      <form onSubmit={opslaan} className="mt-8 space-y-5">
        <Input label="Bedrijfsnaam" name="naam" defaultValue={bedrijf.naam} required />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Contactpersoon"
            name="contactpersoon"
            defaultValue={bedrijf.contactpersoon ?? ""}
            placeholder="Voor- en achternaam"
          />
          <Input
            label="Telefoon"
            name="telefoon"
            type="tel"
            defaultValue={bedrijf.telefoon ?? ""}
            placeholder="06…"
          />
        </div>
        <Input
          label="Website"
          name="website"
          type="url"
          defaultValue={bedrijf.website ?? ""}
          placeholder="https://"
        />
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={bezig}>
            {bezig ? "Opslaan…" : "Opslaan"}
          </Button>
          {opgeslagen && <span className="text-sm text-succes">Opgeslagen ✓</span>}
        </div>
      </form>
    </div>
  );
}
