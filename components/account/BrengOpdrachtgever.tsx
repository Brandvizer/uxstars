"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { beveelBedrijfAan } from "@/app/account/actions";

export type Aanbeveling = {
  id: string;
  bedrijf_naam: string;
  status: string;
  created_at: string;
};

function leadBadge(status: string) {
  if (status === "binnen") return <Badge kleur="succes">Binnen ✦</Badge>;
  if (status === "benaderd") return <Badge kleur="accent">Benaderd</Badge>;
  if (status === "afgewezen") return <Badge>Afgewezen</Badge>;
  return <Badge kleur="accent">Nieuw</Badge>;
}

export default function BrengOpdrachtgever({
  aanbevelingen,
}: {
  aanbevelingen: Aanbeveling[];
}) {
  const [status, setStatus] = useState<
    "idle" | "bezig" | "verzonden" | "fout"
  >("idle");
  const [lijst, setLijst] = useState<Aanbeveling[]>(aanbevelingen);

  const verstuur = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("bezig");
    const form = e.currentTarget;
    const f = new FormData(form);
    const naam = String(f.get("bedrijf_naam") ?? "");
    const r = await beveelBedrijfAan({
      bedrijf_naam: naam,
      contact_naam: String(f.get("contact_naam") ?? ""),
      contact_email: String(f.get("contact_email") ?? ""),
      toelichting: String(f.get("toelichting") ?? ""),
    });
    if (r.ok) {
      setStatus("verzonden");
      setLijst((l) => [
        {
          id: `tmp-${l.length}-${naam}`,
          bedrijf_naam: naam,
          status: "nieuw",
          created_at: "",
        },
        ...l,
      ]);
      form.reset();
    } else {
      setStatus("fout");
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-lijn bg-paneel p-6 sm:p-8">
      <h2 className="text-xl font-semibold">Breng een opdrachtgever binnen</h2>
      <p className="mt-2 text-tekst-secundair">
        Ken je een opdrachtgever die een ster zoekt? Breng ze binnen — wij volgen
        op. Zo groeit het stelsel ook aan de vraagkant.
      </p>

      <form onSubmit={verstuur} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Bedrijfsnaam" name="bedrijf_naam" required />
          <Input label="Contactpersoon" name="contact_naam" autoComplete="off" />
        </div>
        <Input
          label="E-mail (optioneel)"
          name="contact_email"
          type="email"
          placeholder="contact@bedrijf.nl"
        />
        <Textarea
          label="Toelichting (optioneel)"
          name="toelichting"
          placeholder="Hoe ken je ze, en wat zoeken ze?"
        />
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={status === "bezig"}>
            {status === "bezig" ? "Versturen…" : "Aanbevelen"}
          </Button>
          {status === "verzonden" && (
            <span className="text-sm text-succes">Bedankt — staat in de pool ✓</span>
          )}
          {status === "fout" && (
            <span className="text-sm text-accent-actief">
              Er ging iets mis. Probeer het opnieuw.
            </span>
          )}
        </div>
      </form>

      {lijst.length > 0 && (
        <div className="mt-6 border-t border-lijn pt-5">
          <p className="text-sm text-tekst-secundair">Jouw aanbevelingen</p>
          <ul className="mt-3 space-y-2">
            {lijst.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-lijn bg-achtergrond px-4 py-3"
              >
                <span className="truncate">{a.bedrijf_naam}</span>
                {leadBadge(a.status)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
