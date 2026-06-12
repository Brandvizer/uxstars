import type { Metadata } from "next";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Over ons",
  description:
    "Waarom UXSTARS bestaat: een netwerk waar UX-designers voor elkaar instaan en opdrachtgevers zonder ruis de juiste mensen vinden.",
};

const principes = [
  {
    titel: "Vouchen boven werven",
    tekst:
      "De beste voorspeller van een goede samenwerking is iemand die het al meemaakte. Daarom komt niemand binnen zonder vouch.",
  },
  {
    titel: "Transparantie boven marge",
    tekst:
      "Tarieven zijn zichtbaar voor beide kanten. Wij verdienen aan een vaste fee, niet aan het verschil.",
  },
  {
    titel: "Het stelsel boven het individu",
    tekst:
      "Sterren helpen elkaar — met reviews, introducties en af en toe een reddingsmissie. Dat maakt elke individuele missie sterker.",
  },
];

export default function OverOnsPagina() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="!text-[clamp(2rem,4vw+0.5rem,3.5rem)]">
          Waarom we een stelsel bouwen
        </h1>
        <div className="mt-6 space-y-5 text-xl text-tekst-secundair">
          <p>
            De markt voor UX-talent is kapot op twee manieren tegelijk.
            Opdrachtgevers waden door cv-stapels en bureaumarges. Goede
            zelfstandige designers doen hun mooiste werk in stilte, zonder
            netwerk dat voor ze instaat.
          </p>
          <p>
            UXSTARS draait het om. Designers vouchen elkaar — alleen wie
            aanbevolen wordt door iemand die met je werkte, krijgt een plek in
            het stelsel. Opdrachtgevers plaatsen een missie en zien binnen
            dagen wie er past. Geen ruis, geen marges op marges.
          </p>
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {principes.map((principe) => (
          <div
            key={principe.titel}
            className="rounded-2xl border border-lijn bg-paneel p-8"
          >
            <h3>{principe.titel}</h3>
            <p className="mt-2 text-base text-tekst-secundair">
              {principe.tekst}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-lijn bg-paneel p-8 text-center sm:p-12">
        <h2>Praat met ons</h2>
        <p className="mx-auto mt-3 max-w-xl text-tekst-secundair">
          Vragen over het netwerk, een missie of een samenwerking? We horen
          graag van je.
        </p>
        <div className="mt-7">
          <Button href="mailto:hallo@uxstars.nl" size="lg">
            hallo@uxstars.nl
          </Button>
        </div>
      </div>
    </div>
  );
}
