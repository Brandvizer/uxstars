import type { Metadata } from "next";
import Logo from "@/components/ui/Logo";
import SterrenVeld from "@/components/constellation/SterrenVeld";
import WachtlijstForm from "@/components/marketing/WachtlijstForm";
import LogoRij from "@/components/home/LogoRij";

export const metadata: Metadata = {
  title: "Binnenkort",
  description:
    "Een besloten netwerk van gevouchte digital designers. Geen cv-loterij, voor designers én opdrachtgevers. Zet jezelf op de lijst voor vroege toegang.",
};

const PIJN = [
  {
    label: "Voor designers",
    pijn: [
      "Je cv verdwijnt in de stapel.",
      "Portfolio de leegte in, nooit een reactie.",
      "Recruiterspam voor rollen die niet kloppen.",
    ],
    belofte: [
      "Gevouched binnen, geen sollicitatiecircus.",
      "Alleen missies die echt bij je passen.",
      "Rechtstreeks met het team, binnen dagen live.",
    ],
  },
  {
    label: "Voor opdrachtgevers",
    pijn: [
      "Honderd cv's, een handvol dat deugt.",
      "Kwaliteit blijkt pas ná het tekenen.",
      "Bureaus rekenen een flinke opslag.",
    ],
    belofte: [
      "Alleen vooraf gevouchte designers.",
      "Plaats een missie, match binnen dagen.",
      "Eén helder tarief, geen verrassingen.",
    ],
  },
];

const STAPPEN = [
  {
    titel: "Word gevouched",
    tekst: "Een lid neemt je mee het stelsel in, of je vraagt zelf toegang aan.",
  },
  {
    titel: "Missies en sterren komen samen",
    tekst: "Opdrachtgevers plaatsen een missie, designers reageren op wat past.",
  },
  {
    titel: "Binnen dagen aan boord",
    tekst: "Direct contact, geen tussenlaag. Zo simpel houden we het.",
  },
];

export default function VroegPage() {
  return (
    <div className="relative">
      {/* Beeldvullend sterrenstelsel: vast achter de hele pagina */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {/* Rustige achtergrondmodus: minder sterren, geen foto's, zachte lijnen. */}
        <SterrenVeld
          interactief={false}
          rustig
          className="veld-in absolute inset-0 opacity-80"
        />
        {/* Donkere kern achter de tekstkolom, zodat kop en formulier vrijstaan */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 45%, rgba(10,14,26,0.85), rgba(10,14,26,0.45) 60%, transparent 85%)",
          }}
        />
      </div>

      {/* Merkteken: het echte UXSTARS-logo (geïsoleerde pagina, bewust geen link) */}
      <div className="relative z-10 flex items-center justify-center pt-10">
        <Logo className="h-12 w-auto text-tekst sm:h-14" />
      </div>

      {/* Hero + inschrijfformulier */}
      <section className="relative z-10">
        <div className="pointer-events-none relative mx-auto flex max-w-2xl flex-col items-center px-4 pb-16 pt-16 text-center sm:px-6">
          <p
            className="label rijs-in mb-5 flex items-center gap-2.5 text-accent"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="h-px w-6 bg-accent/50" />
            Founding · de eerste 100 sterren
            <span className="h-px w-6 bg-accent/50" />
          </p>
          <h1
            className="rijs-in text-balance"
            style={{ animationDelay: "0.22s" }}
          >
            Elke designer een ster.
            <br />
            Elke opdracht een missie.
          </h1>
          <p
            className="rijs-in mt-4 max-w-xl text-base text-tekst-secundair"
            style={{ animationDelay: "0.36s" }}
          >
            Solliciteren voelt als een loterij, screenen als gokken. UXSTARS
            draait het om: een besloten netwerk van gevouchte digital designers,
            van UX tot UI en product, waar werk en talent elkaar rechtstreeks
            vinden.
          </p>

          <div
            id="aanmelden"
            className="rijs-in mt-7 flex w-full scroll-mt-24 justify-center"
            style={{ animationDelay: "0.5s" }}
          >
            <WachtlijstForm />
          </div>
        </div>
        {/* Sociaal bewijs direct onder het formulier */}
        <div className="rijs-in" style={{ animationDelay: "0.65s" }}>
          <LogoRij compact />
        </div>
      </section>

      {/* De pijn die we verhelpen — voor beide kanten */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6">
        <p className="label text-center text-accent">
          Waarom UXSTARS
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-balance">
          Aannemen en aangenomen worden zonder de ruis
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {PIJN.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl border border-lijn bg-paneel p-6 sm:p-8"
            >
              <p className="label text-accent">
                {k.label}
              </p>

              <p className="mt-5 text-sm font-semibold text-tekst-secundair">
                Nu voelt het zo
              </p>
              <ul className="mt-3 space-y-2.5 text-base">
                {k.pijn.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-tekst-secundair">
                    {/* h-[1lh] = hoogte van één tekstregel, zodat het icoon
                        exact op de eerste regel centreert, ook bij afbreken. */}
                    <span className="flex h-[1lh] shrink-0 items-center">
                      <svg
                        viewBox="0 0 20 20"
                        className="h-5 w-5 text-tekst-secundair/40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M6 6l8 8M14 6l-8 8" />
                      </svg>
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <div className="my-5 h-px bg-lijn" />

              <p className="text-sm font-semibold text-succes">Met UXSTARS</p>
              <ul className="mt-3 space-y-2.5 text-base">
                {k.belofte.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="flex h-[1lh] shrink-0 items-center">
                      <svg
                        viewBox="0 0 20 20"
                        className="h-5 w-5 text-succes"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M4 10.5l4 4 8-9" />
                      </svg>
                    </span>
                    <span className="text-tekst">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Hoe het werkt — drie stappen (echte volgorde, dus genummerd) */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-16 sm:px-6">
        <p className="label text-center text-accent">
          Hoe het werkt
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {STAPPEN.map((s, i) => (
            <div
              key={s.titel}
              className="rounded-2xl border border-lijn bg-paneel p-6"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 font-mono text-sm font-bold text-accent">
                {i + 1}
              </span>
              <h3 className="mt-4 text-tekst">{s.titel}</h3>
              <p className="mt-2 text-base text-tekst-secundair">{s.tekst}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
