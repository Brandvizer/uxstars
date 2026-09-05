import type { Metadata } from "next";
import MissieKaart from "@/components/missie/MissieKaart";
import Button from "@/components/ui/Button";
import { FOUNDING_FASE, FOUNDING_TEKST } from "@/lib/founding-fase";
import { getMissies } from "@/lib/missies";

export const metadata: Metadata = {
  title: "Missies",
  description:
    "Open UX-missies bij opdrachtgevers die op zoek zijn naar een ster uit het UXSTARS-netwerk.",
};

// Missies uit Supabase: periodiek hervalideren (ISR).
export const revalidate = 300;

export default async function MissiesPagina() {
  const missies = await getMissies();
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1>Open missies</h1>
        <p className="mt-4 text-tekst-secundair tekst-intro">
          Opdrachten van opdrachtgevers die een ster zoeken. Reageer als het
          past, of stuur de missie door naar iemand uit jouw stelsel.
        </p>
      </div>

      {FOUNDING_FASE && (
        <div className="mt-10 rounded-2xl border border-accent/40 bg-accent/5 p-6 sm:p-8">
          <p className="label text-accent">Founding-fase</p>
          <h2 className="mt-2 kop-3">De eerste missies komen eraan</h2>
          <p className="mt-2 max-w-2xl text-tekst-secundair">
            {FOUNDING_TEKST.kort} De komende weken halen we de eerste
            opdrachtgevers binnen. Zorg dat je profiel compleet is, dan sta je
            vooraan als de eerste missie live gaat.
          </p>
          <div className="mt-5">
            <Button href="/account" variant="secundair">
              Naar je profiel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {missies.map((missie) => (
          <MissieKaart key={missie.slug} missie={missie} />
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-lijn bg-paneel p-8 text-center sm:p-12">
        <h2>Zelf een ster nodig?</h2>
        <p className="mx-auto mt-3 max-w-xl text-tekst-secundair">
          Plaats je missie in zeven korte stappen. Wij kijken mee en brengen
          hem onder de aandacht van de juiste sterren.
        </p>
        <div className="mt-7">
          <Button href="/missie-plaatsen" size="lg">
            Plaats een missie
          </Button>
        </div>
      </div>
    </div>
  );
}
