import type { Metadata } from "next";
import MissieKaart from "@/components/missie/MissieKaart";
import Button from "@/components/ui/Button";
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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="!text-[clamp(2rem,4vw+0.5rem,3.5rem)]">Open missies</h1>
        <p className="mt-4 text-xl text-tekst-secundair">
          Opdrachten van opdrachtgevers die een ster zoeken. Reageer als het
          past — of stuur de missie door naar iemand uit jouw stelsel.
        </p>
      </div>

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
