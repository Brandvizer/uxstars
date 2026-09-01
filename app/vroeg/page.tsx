import type { Metadata } from "next";
import Logo from "@/components/ui/Logo";
import SterrenVeld from "@/components/constellation/SterrenVeld";
import WachtlijstForm from "@/components/marketing/WachtlijstForm";

export const metadata: Metadata = {
  title: "Binnenkort — UXSTARS",
  description:
    "Een besloten netwerk van gevouchte UX-designers. Geen cv-loterij, voor designers én opdrachtgevers. Zet jezelf op de lijst voor vroege toegang.",
};

const PIJN = [
  {
    label: "Voor designers",
    pijn: [
      "Solliciteren tegen honderden onbekenden.",
      "Je portfolio de leegte in, nul terugkoppeling.",
      "Recruiterspam die nét niet past.",
    ],
    belofte: [
      "Je bent gevouched, geen sollicitatie-stress.",
      "Missies die passen komen naar jóu toe.",
      "Direct contact, geen tussenlaag. Binnen dagen aan de slag.",
    ],
  },
  {
    label: "Voor opdrachtgevers",
    pijn: [
      "Cv-stapels doorspitten, wekenlang screenen.",
      "Gokken op kwaliteit die je pas achteraf ziet.",
      "Dure bureaus met een flinke opslag.",
    ],
    belofte: [
      "Voorgeselecteerd, gevoucht talent. Geen ruis.",
      "Plaats een missie, koppel binnen dagen de juiste ster.",
      "Heldere prijs, geen verrassingen.",
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
        <SterrenVeld interactief={false} className="veld-in absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 72% 62% at 50% 38%, rgba(10,14,26,0.60), rgba(10,14,26,0.26) 68%, transparent)",
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
            className="rijs-in mb-5 flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.25em] text-accent"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="h-px w-6 bg-accent/50" />
            Binnenkort · toegang op uitnodiging
            <span className="h-px w-6 bg-accent/50" />
          </p>
          <h1
            className="rijs-in text-balance !text-[clamp(1.9rem,3.5vw+1rem,3.1rem)]"
            style={{ animationDelay: "0.22s" }}
          >
            Elke designer een ster.
            <br />
            Elke opdracht een missie.
          </h1>
          <p
            className="rijs-in mt-4 max-w-xl text-base text-tekst-secundair sm:text-lg"
            style={{ animationDelay: "0.36s" }}
          >
            Werk vinden en talent vinden hoort niet te voelen als een cv-loterij.
            UXSTARS is een besloten netwerk van gevouchte UX-designers. We openen
            in fasen.
          </p>

          <div
            id="aanmelden"
            className="rijs-in mt-7 flex w-full scroll-mt-24 justify-center"
            style={{ animationDelay: "0.5s" }}
          >
            <WachtlijstForm />
          </div>
        </div>
      </section>

      {/* De pijn die we verhelpen — voor beide kanten */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-accent">
          Waarom UXSTARS
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-balance !text-[clamp(1.6rem,3vw+.6rem,2.4rem)]">
          Aannemen en aangenomen worden zonder de ruis
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {PIJN.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl border border-lijn bg-paneel p-6 sm:p-8"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                {k.label}
              </p>

              <p className="mt-5 text-sm font-semibold text-tekst-secundair">
                Nu voelt het zo
              </p>
              <ul className="mt-2 space-y-2">
                {k.pijn.map((p) => (
                  <li key={p} className="flex gap-2.5 text-tekst-secundair">
                    <span className="mt-1 text-tekst-secundair/60" aria-hidden="true">
                      ✕
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <div className="my-5 h-px bg-lijn" />

              <p className="text-sm font-semibold text-succes">Met UXSTARS</p>
              <ul className="mt-2 space-y-2">
                {k.belofte.map((b) => (
                  <li key={b} className="flex gap-2.5">
                    <span className="mt-1 text-accent" aria-hidden="true">
                      ✦
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
        <p className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-accent">
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
              <h3 className="mt-4 text-lg font-semibold text-tekst">{s.titel}</h3>
              <p className="mt-2 text-sm text-tekst-secundair">{s.tekst}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
