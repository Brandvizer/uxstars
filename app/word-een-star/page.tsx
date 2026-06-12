import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import SterrenVeld from "@/components/constellation/SterrenVeld";

export const metadata: Metadata = {
  title: "Word een star",
  description:
    "Sluit je aan bij het UXSTARS-netwerk: mooie missies, eerlijke tarieven en een stelsel van collega's dat voor je instaat.",
};

// Sterrenveld uit Supabase: periodiek hervalideren (ISR).
export const revalidate = 300;

const redenen = [
  {
    titel: "Missies die ertoe doen",
    tekst:
      "Geen bodyshopping. Opdrachten met een duidelijk probleem, een echt team en ruimte om je vak uit te oefenen.",
  },
  {
    titel: "Eerlijk tarief, transparante fee",
    tekst:
      "Jij ziet wat de opdrachtgever betaalt. Onze fee is vast en bescheiden — de rest is voor jou.",
  },
  {
    titel: "Een stelsel om je heen",
    tekst:
      "Sparren over een lastige stakeholder, een review op je onderzoeksopzet of een tweede ster op een grote missie. Je staat er niet alleen voor.",
  },
];

const stappen = [
  {
    titel: "Vraag een vouch",
    tekst:
      "Je komt binnen via een ster die met je werkte en voor je instaat. Ken je nog niemand in het stelsel? Meld je aan, dan kijken we samen wie je werk kent.",
  },
  {
    titel: "Kennismaking",
    tekst:
      "Een goed gesprek over je werk, je ambities en wat voor missies bij je passen. Geen assessment, wel diepgang.",
  },
  {
    titel: "Je ster gaat aan",
    tekst:
      "Je verschijnt in het stelsel. Zodra je beschikbaar bent, gloeit je ster en vinden missies jou.",
  },
];

export default function WordEenStarPagina() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <h1 className="!text-[clamp(2rem,4vw+0.5rem,3.5rem)]">
            Schitter in een stelsel, niet alleen
          </h1>
          <p className="mt-5 text-xl text-tekst-secundair">
            UXSTARS is een netwerk van zelfstandige UX-professionals die elkaar
            vouchen, helpen en aanvullen. Geen detacheerder, geen platform met
            duizend profielen — een constellation waar je bij wílt horen.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {redenen.map((reden) => (
            <div
              key={reden.titel}
              className="rounded-2xl border border-lijn bg-paneel p-8"
            >
              <h3>{reden.titel}</h3>
              <p className="mt-2 text-base text-tekst-secundair">
                {reden.tekst}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mt-20 overflow-hidden rounded-2xl border border-lijn">
          <SterrenVeld interactief={false} className="absolute inset-0" />
          <div className="pointer-events-none relative bg-gradient-to-t from-achtergrond/90 via-transparent p-8 sm:p-12">
            <h2 className="max-w-xl">Zo word je een ster in het stelsel</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {stappen.map((stapItem, i) => (
                <div key={stapItem.titel}>
                  <span className="text-sm font-semibold text-accent">
                    Stap {i + 1}
                  </span>
                  <h3 className="mt-2">{stapItem.titel}</h3>
                  <p className="mt-2 text-base text-tekst-secundair">
                    {stapItem.tekst}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Button
            href="mailto:hallo@uxstars.nl?subject=Ik wil een star worden"
            size="lg"
          >
            Meld je aan
          </Button>
          <p className="mt-4 text-sm text-tekst-secundair">
            In fase één gaat aanmelden per e-mail. Vertel kort wie je bent en
            met wie je werkte.
          </p>
        </div>
      </div>
    </div>
  );
}
