"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { beveelBedrijfAan } from "@/app/account/actions";
import { AANBRENGEN, aanbrengLink } from "@/lib/aanbrengen";

export type Aanbeveling = {
  id: string;
  bedrijf_naam: string;
  status: string;
  created_at: string;
};

function leadBadge(status: string) {
  if (status === "uitbetaald")
    return <Badge kleur="succes">Beloning uitbetaald</Badge>;
  if (status === "betalend")
    return (
      <Badge kleur="succes">Betalend, {AANBRENGEN.bedragTekst} onderweg</Badge>
    );
  if (status === "proefperiode")
    return <Badge kleur="succes">In proefperiode</Badge>;
  if (status === "binnen")
    return <Badge kleur="succes">Account aangemaakt</Badge>;
  if (status === "benaderd") return <Badge kleur="accent">Uitgenodigd</Badge>;
  if (status === "afgewezen") return <Badge>Niet doorgegaan</Badge>;
  return <Badge kleur="accent">Aangebracht</Badge>;
}

export default function BrengOpdrachtgever({
  aanbevelingen,
  aanbrengCode,
}: {
  aanbevelingen: Aanbeveling[];
  aanbrengCode: string | null;
}) {
  const [status, setStatus] = useState<"idle" | "bezig" | "verzonden" | "fout">(
    "idle",
  );
  const [gemaild, setGemaild] = useState(false);
  const [gekopieerd, setGekopieerd] = useState(false);
  const [lijst, setLijst] = useState<Aanbeveling[]>(aanbevelingen);

  const link = aanbrengCode
    ? aanbrengLink(
        typeof window !== "undefined" ? window.location.origin : "",
        aanbrengCode,
      )
    : null;

  const kopieer = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {}
  };

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
      setGemaild(r.gemaild);
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
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-accent/50 bg-paneel p-6 shadow-[0_0_60px_rgba(245,185,65,0.12)] sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 80% at 100% 0%, rgba(245,185,65,0.14), transparent 70%)",
        }}
      />
      <div className="relative">
        <p className="label text-accent">
          Verdien {AANBRENGEN.bedragTekst} per opdrachtgever
        </p>
        <h2 className="mt-3 kop-2">Breng een opdrachtgever binnen</h2>
        <p className="mt-3 max-w-2xl text-tekst-secundair">
          Ken je een organisatie die een ster zoekt? Wordt die betalend Partner,
          dan krijg jij{" "}
          <span className="font-semibold text-tekst">
            {AANBRENGEN.bedragTekst}
          </span>{" "}
          en een extra vouch. Automatisch, zonder gedoe: wij zien wie via jou
          binnenkwam en mailen je zodra de beloning klaarstaat.
        </p>

        {link && (
          <div className="mt-5 rounded-xl border border-lijn bg-achtergrond p-4">
            <p className="tekst-klein text-tekst-secundair">
              Jouw aanbrenglink. Deel hem waar je wilt; iedereen die er een
              bedrijfsaccount mee aanmaakt, is aan jou gekoppeld.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-paneel px-3 py-2 text-sm text-tekst">
                {link}
              </code>
              <Button type="button" size="sm" variant="ghost" onClick={kopieer}>
                {gekopieerd ? "Gekopieerd" : "Kopieer link"}
              </Button>
            </div>
          </div>
        )}

        <p className="mt-6 font-semibold">Of laat ons ze uitnodigen</p>
        <p className="mt-1 tekst-klein text-tekst-secundair">
          Vul een e-mailadres in en de opdrachtgever krijgt direct een nette
          mail uit jouw naam, met jouw link erin.
        </p>

        <form onSubmit={verstuur} className="mt-4 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Bedrijfsnaam"
              icoon="gebouw"
              placeholder="Naam van het bedrijf"
              name="bedrijf_naam"
              required
            />
            <Input
              label="Contactpersoon"
              icoon="persoon"
              placeholder="Voor- en achternaam"
              name="contact_naam"
              autoComplete="off"
            />
          </div>
          <Input
            label="E-mail (optioneel)"
            name="contact_email"
            type="email"
            placeholder="naam@voorbeeld.nl"
          />
          <Textarea
            label="Toelichting (optioneel)"
            name="toelichting"
            placeholder="Hoe ken je ze, en wat zoeken ze?"
          />
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={status === "bezig"}>
              {status === "bezig" ? "Versturen…" : "Breng binnen"}
            </Button>
            {status === "verzonden" && (
              <span className="text-sm text-succes">
                {gemaild
                  ? "Bedankt, de uitnodiging is verstuurd"
                  : "Bedankt, staat in de pool"}
              </span>
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
            <p className="font-semibold">Jouw aanbevelingen</p>
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
    </div>
  );
}
