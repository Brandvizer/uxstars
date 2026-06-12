import Link from "next/link";
import type { Metadata } from "next";
import { verhalen } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Verhalen",
  description:
    "Verhalen uit het stelsel: hoe sterren van UXSTARS missies tot een goed einde brachten.",
};

export default function VerhalenPagina() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="!text-[clamp(2rem,4vw+0.5rem,3.5rem)]">
          Verhalen uit het stelsel
        </h1>
        <p className="mt-4 text-xl text-tekst-secundair">
          Geen portfolioplaatjes maar echte missies: het probleem, de aanpak en
          wat het opleverde.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {verhalen.map((verhaal) => (
          <article
            key={verhaal.slug}
            className="flex flex-col rounded-2xl border border-lijn bg-paneel p-8 transition-colors duration-300 ease-uit hover:border-accent/40"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">
              {verhaal.rol}
            </p>
            <h3 className="mt-3">
              <Link
                href={`/verhalen/${verhaal.slug}`}
                className="transition-colors duration-200 hover:text-accent-actief"
              >
                {verhaal.titel}
              </Link>
            </h3>
            <p className="mt-3 flex-1 text-base text-tekst-secundair">
              {verhaal.ondertitel}
            </p>
            <p className="mt-5 text-sm text-tekst-secundair">
              Met {verhaal.ster}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
