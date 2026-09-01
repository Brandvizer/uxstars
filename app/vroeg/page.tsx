import type { Metadata } from "next";
import SterrenVeld from "@/components/constellation/SterrenVeld";
import WachtlijstForm from "@/components/marketing/WachtlijstForm";

export const metadata: Metadata = {
  title: "Binnenkort — UXSTARS",
  description:
    "UXSTARS is een besloten netwerk van gevouchte UX-designers. We openen in fasen — zet jezelf op de lijst voor vroege toegang.",
};

const PUNTEN = [
  {
    titel: "Gevouchte kwaliteit",
    tekst: "Je komt binnen via een vouch van een lid. Geen ruis, alleen sterren.",
  },
  {
    titel: "Missies, geen cv-stapels",
    tekst: "Opdrachtgevers plaatsen missies; designers reageren zelf.",
  },
  {
    titel: "Binnen dagen aan boord",
    tekst: "Voorgeselecteerd talent, direct contact. Geen weken screening.",
  },
];

export default function VroegPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <SterrenVeld className="veld-in absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 48%, rgba(10,14,26,0.82), transparent 74%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-achtergrond to-transparent" />

        <div className="pointer-events-none relative mx-auto flex min-h-[88vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
          <p
            className="rijs-in mb-6 flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.25em] text-accent"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="h-px w-6 bg-accent/50" />
            Binnenkort · het stelsel opent
            <span className="h-px w-6 bg-accent/50" />
          </p>
          <h1 className="rijs-in max-w-3xl text-balance" style={{ animationDelay: "0.22s" }}>
            Elke designer een ster.
            <br />
            Elke opdracht een missie.
          </h1>
          <p
            className="rijs-in mt-6 max-w-xl text-lg text-tekst-secundair sm:text-xl"
            style={{ animationDelay: "0.36s" }}
          >
            UXSTARS is een besloten netwerk van gevouchte UX-designers. Geen
            cv-stapels — sterren die voor elkaar instaan. We openen in fasen. Zet
            jezelf op de lijst.
          </p>

          <div className="rijs-in mt-10 flex w-full justify-center" style={{ animationDelay: "0.5s" }}>
            <WachtlijstForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {PUNTEN.map((p) => (
            <div
              key={p.titel}
              className="rounded-2xl border border-lijn bg-paneel p-6"
            >
              <span className="text-accent" aria-hidden="true">
                ✦
              </span>
              <h2 className="mt-3 text-lg font-semibold">{p.titel}</h2>
              <p className="mt-2 text-sm text-tekst-secundair">{p.tekst}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
