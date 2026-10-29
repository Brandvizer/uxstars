import type { Metadata } from "next";
import LogoBalk from "@/components/marketing/LogoBalk";
import SterrenVeld from "@/components/constellation/SterrenVeld";
import WachtlijstForm from "@/components/marketing/WachtlijstForm";
import LogoRij from "@/components/home/LogoRij";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Het besloten stelsel van digital designers",
  description:
    "UXSTARS is een invite-only netwerk van gevouchte digital designers. Opdrachtgevers huren binnen dagen een ster in, zonder cv-loterij en zonder zorgen over de Wet DBA.",
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

const CONCEPT = [
  {
    titel: "Geen vacaturebank, geen bureau",
    tekst:
      "UXSTARS is een zelf-curerend stelsel waarin designers elkaar persoonlijk aanbevelen. Elke designer is een ster, elke opdracht een missie.",
  },
  {
    titel: "Binnen via een vouch",
    tekst:
      "Je komt alleen binnen als een vakgenoot die met je werkte voor je instaat. Elk lid krijgt één vouch om weg te geven. Zo groeit het stelsel ster voor ster en blijft de kwaliteit hoog.",
  },
  {
    titel: "Rechtstreeks contact",
    tekst:
      "Opdrachtgever en designer spreken elkaar direct. Geen tussenlaag die mailt, belt en marge pakt. Wij zorgen alleen dat de match klopt en het contract deugt.",
  },
];

const MANIEREN = [
  {
    titel: "Direct",
    kop: "Jullie tekenen rechtstreeks",
    tekst:
      "Opdrachtgever en ster sluiten zelf het contract. UXSTARS brengt jullie bij elkaar en rekent een vaste, transparante fee per uur.",
    punten: [
      "Eigen contract tussen opdrachtgever en ster",
      "Vaste fee per uur, geen verrassingen",
      "Snelste route als je het inhuren al goed geregeld hebt",
    ],
  },
  {
    titel: "Via UXSTARS",
    kop: "Wij zijn de contractlaag",
    tekst:
      "Het contract loopt via UXSTARS. De opdrachtgever draagt geen risico op schijnzelfstandigheid, de ster blijft volledig zelfstandig met eigen tarief en eigen onderneming.",
    punten: [
      "Geen Wet DBA-zorgen voor de opdrachtgever",
      "Ster blijft 100% zelfstandig",
      "Eén factuur, wij regelen contract en compliance",
    ],
  },
];

const WAARDE = [
  {
    label: "Voor designers",
    kop: "Vrijheid, verbondenheid en rugdekking",
    tekst:
      "Zelfstandig blijven en toch bij een exclusief stelsel horen. Toegang tot mooie missies, vakgenoten die voor je instaan en geen contract- en compliancegedoe.",
  },
  {
    label: "Voor opdrachtgevers",
    kop: "Snel, vertrouwd en veilig",
    tekst:
      "Binnen dagen een gevouchte ster, aanbevolen door vakgenoten, zonder Wet DBA-risico en met direct menselijk contact in plaats van een bureaulaag.",
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

      <LogoBalk />

      {/* Hero + inschrijfformulier */}
      <section className="relative z-10">
        <div className="pointer-events-none relative mx-auto flex max-w-2xl flex-col items-center px-4 pb-16 pt-16 text-center sm:px-6">
          <p
            className="label rijs-in mb-5 flex items-center justify-center gap-2.5 text-center text-accent"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="hidden h-px w-6 bg-accent/50 sm:block" />
            Het besloten stelsel van digital designers
            <span className="hidden h-px w-6 bg-accent/50 sm:block" />
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
            UXSTARS is een invite-only netwerk van gevouchte digital designers,
            van UX tot UI en product. Opdrachtgevers huren binnen dagen een ster
            in, zonder cv-loterij, zonder bureaulaag en zonder zorgen over de
            Wet DBA.
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

      {/* Wat is UXSTARS: het concept in drie zinnen */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6">
        <p className="label text-center text-accent">Wat is UXSTARS</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-balance">
          Een stelsel dat zichzelf cureert
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {CONCEPT.map((c) => (
            <div
              key={c.titel}
              className="rounded-2xl border border-lijn bg-paneel p-6"
            >
              <h3 className="text-tekst">{c.titel}</h3>
              <p className="mt-2 text-base text-tekst-secundair">{c.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Waarom nu: Wet DBA */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-4 sm:px-6">
        <div className="rounded-2xl border border-accent/30 bg-paneel p-6 sm:p-10 md:grid md:grid-cols-5 md:gap-10">
          <div className="md:col-span-2">
            <p className="label text-accent">Waarom nu</p>
            <h2 className="mt-3 text-balance">
              Toptalent inhuren zonder Wet DBA-risico
            </h2>
          </div>
          <div className="mt-5 space-y-4 text-base text-tekst-secundair md:col-span-3 md:mt-0">
            <p>
              Sinds de handhaving van de Wet DBA in 2025 is het voor bedrijven
              risicovol om zzp&apos;ers rechtstreeks in te huren. Schijnzelfstandigheid
              kan naheffingen opleveren. Bedrijven willen nog steeds de beste
              designers, maar zonder dat risico.
            </p>
            <p className="text-tekst">
              UXSTARS lost precies dat op. Je huurt in zonder Wet DBA-zorgen,
              terwijl de designer volledig zelfstandig blijft.
            </p>
          </div>
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
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6">
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

      {/* Twee manieren om in te huren */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6">
        <p className="label text-center text-accent">Twee manieren om samen te werken</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-balance">
          Direct of via UXSTARS, jullie kiezen
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {MANIEREN.map((m) => (
            <div
              key={m.titel}
              className="rounded-2xl border border-lijn bg-paneel p-6 sm:p-8"
            >
              <p className="label text-accent">{m.titel}</p>
              <h3 className="mt-3 text-tekst">{m.kop}</h3>
              <p className="mt-2 text-base text-tekst-secundair">{m.tekst}</p>
              <div className="my-5 h-px bg-lijn" />
              <ul className="space-y-2.5 text-base">
                {m.punten.map((p) => (
                  <li key={p} className="flex items-start gap-3">
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
                    <span className="text-tekst">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* De waarde, voor beide kanten */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6">
        <p className="label text-center text-accent">De waarde</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-balance">
          Wat je eraan hebt
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {WAARDE.map((w) => (
            <div
              key={w.label}
              className="rounded-2xl border border-lijn bg-paneel p-6 sm:p-8"
            >
              <p className="label text-accent">{w.label}</p>
              <h3 className="mt-3 text-tekst">{w.kop}</h3>
              <p className="mt-2 text-base text-tekst-secundair">{w.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Slot: terug naar het formulier */}
      <section className="relative z-10 mx-auto max-w-2xl px-4 pb-24 pt-16 text-center sm:px-6">
        <p className="label text-accent">Founding</p>
        <h2 className="mt-3 text-balance">We openen met de eerste 100 sterren</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-tekst-secundair">
          Designer? Claim je founding-plek en help het stelsel vormgeven.
          Opdrachtgever? Laat je e-mail achter, dan ben je als eerste aan de
          beurt zodra we opengaan.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/vroeg/aanmelden">Claim je founding-plek</Button>
          <Button href="#aanmelden" variant="ghost">
            Ik ben opdrachtgever
          </Button>
        </div>
      </section>
    </div>
  );
}
