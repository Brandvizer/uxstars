import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import LogoRij from "@/components/home/LogoRij";

export const metadata: Metadata = {
  title: "Voor opdrachtgevers",
  description:
    "Vind een gevouchte UX-designer voor je team. Plaats een missie en ontvang binnen dagen reacties uit het UXSTARS-netwerk.",
};

const stappen = [
  {
    titel: "Plaats je missie",
    tekst:
      "Zeven korte vragen over de opdracht, het team en het tarief. Klaar in vijf minuten.",
  },
  {
    titel: "Wij lichten het stelsel op",
    tekst:
      "Je missie bereikt precies de sterren die passen op rol, seniority en beschikbaarheid. Wij kijken mee op scherpte.",
  },
  {
    titel: "Kies je ster",
    tekst:
      "Binnen dagen spreek je één tot drie kandidaten die al gevouched zijn door collega's. Jij kiest, wij regelen de rest.",
  },
];

const verschillen = [
  {
    kop: "Een bureau",
    punten: [
      "Marge van 30–50% op het tarief",
      "Kandidaten uit een database",
      "Accountmanager ertussen",
    ],
  },
  {
    kop: "UXSTARS",
    punten: [
      "Transparante, vaste fee",
      "Sterren die voor elkaar instaan",
      "Direct contact met je designer",
    ],
  },
];

export default function OpdrachtgeversPagina() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <h1 className="!text-[clamp(2rem,4vw+0.5rem,3.5rem)]">
            Een ster vinden hoort geen weken te duren
          </h1>
          <p className="mt-5 text-xl text-tekst-secundair">
            UXSTARS is geen bureau en geen vacaturebank. Het is een stelsel van
            UX-professionals die elkaar kennen, aanvullen en aanbevelen. Jouw
            missie komt direct bij de juiste sterren terecht.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button href="/missie-plaatsen" size="lg">
              Plaats een missie
            </Button>
            <Button href="/bedrijf/login" variant="secundair" size="lg">
              Maak een bedrijfsaccount
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {stappen.map((stapItem, i) => (
            <div
              key={stapItem.titel}
              className="rounded-2xl border border-lijn bg-paneel p-8"
            >
              <span className="text-sm font-semibold text-accent">
                Stap {i + 1}
              </span>
              <h3 className="mt-3">{stapItem.titel}</h3>
              <p className="mt-2 text-base text-tekst-secundair">
                {stapItem.tekst}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <h2>Wat het verschil is</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {verschillen.map((kolom) => (
              <div
                key={kolom.kop}
                className={`rounded-2xl border p-8 ${
                  kolom.kop === "UXSTARS"
                    ? "border-accent/40 bg-paneel"
                    : "border-lijn bg-paneel/50"
                }`}
              >
                <h3 className={kolom.kop === "UXSTARS" ? "text-accent" : ""}>
                  {kolom.kop}
                </h3>
                <ul className="mt-4 space-y-3">
                  {kolom.punten.map((punt) => (
                    <li
                      key={punt}
                      className="flex items-start gap-3 text-base text-tekst-secundair"
                    >
                      <span
                        className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                          kolom.kop === "UXSTARS" ? "bg-accent" : "bg-lijn"
                        }`}
                      />
                      {punt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LogoRij />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-lijn bg-paneel p-8 text-center sm:p-12">
          <h2>Klaar voor lancering?</h2>
          <p className="mx-auto mt-3 max-w-xl text-tekst-secundair">
            Plaats je missie of plan eerst een vrijblijvende kennismaking.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/missie-plaatsen" size="lg">
              Plaats een missie
            </Button>
            <Button
              href="mailto:hallo@uxstars.nl"
              variant="secundair"
              size="lg"
            >
              Stel eerst een vraag
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
