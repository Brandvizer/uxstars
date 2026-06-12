import Link from "next/link";
import Hero from "@/components/home/Hero";
import BelofteKaart from "@/components/home/BelofteKaart";
import LogoRij from "@/components/home/LogoRij";
import SplitsBlok from "@/components/home/SplitsBlok";
import MissieKaart from "@/components/missie/MissieKaart";
import { missies } from "@/lib/mock-data";

const beloften = [
  {
    titel: "Gevouched, niet gescreend",
    tekst:
      "Elke ster is aanbevolen door iemand die écht met haar of hem werkte. Dat zegt meer dan honderd cv's.",
    icoon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
        <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
      </svg>
    ),
  },
  {
    titel: "Binnen dagen aan boord",
    tekst:
      "Geen wekenlange procedures. Een open missie bereikt direct de sterren die beschikbaar zijn en passen.",
    icoon: (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 stroke-current"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2L4.5 13.5H11L9.5 22 19 10.5h-6.5L13 2z" />
      </svg>
    ),
  },
  {
    titel: "Eerlijke tarieven",
    tekst:
      "Transparant voor beide kanten. Geen onzichtbare marges — wat jij betaalt, weet de designer ook.",
    icoon: (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 stroke-current"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 3v18M7 8.5C7 6.5 9 5.5 12 5.5s5 1 5 3-2 2.8-5 3.5-5 1.5-5 3.5 2 3 5 3 5-1 5-3" />
      </svg>
    ),
  },
  {
    titel: "Een stelsel, geen lijstje",
    tekst:
      "Sterren sparren met elkaar, vouchen elkaar en springen bij. Jouw missie krijgt een netwerk, geen eenling.",
    icoon: (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 stroke-current"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="4" r="2" />
        <circle cx="12" cy="13" r="2" />
        <circle cx="6" cy="20" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M6.8 7.2l3.6 4.2M13.8 11.6L17.4 5.4M11 14.7l-3.6 3.8M13.9 13.9l3.6 3.2" />
      </svg>
    ),
  },
];

export default function Home() {
  const openMissies = missies.filter((m) => m.status === "open").slice(0, 3);

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-2xl">Waarom opdrachtgevers en designers hier samenkomen</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {beloften.map((belofte) => (
            <BelofteKaart key={belofte.titel} {...belofte} />
          ))}
        </div>
      </section>

      <LogoRij />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2>Open missies</h2>
          <Link
            href="/missies"
            className="font-semibold text-accent transition-colors duration-200 hover:text-accent-actief"
          >
            Alle missies →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {openMissies.map((missie) => (
            <MissieKaart key={missie.slug} missie={missie} />
          ))}
        </div>
      </section>

      <SplitsBlok />
    </>
  );
}
