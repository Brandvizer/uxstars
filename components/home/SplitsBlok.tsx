import Button from "@/components/ui/Button";

export default function SplitsBlok() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-lijn bg-paneel p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Voor opdrachtgevers
          </p>
          <h2 className="mt-4">Vind een ster die al gevouched is</h2>
          <p className="mt-4 flex-1 text-tekst-secundair">
            Elke designer in het stelsel is aanbevolen door een collega die met
            hem of haar werkte. Jij plaatst een missie, wij matchen binnen
            dagen — geen bureaus, geen marges op marges.
          </p>
          <div className="mt-8">
            <Button href="/opdrachtgevers">Zo werkt het</Button>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-lijn bg-paneel p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-succes">
            Voor designers
          </p>
          <h2 className="mt-4">Schitter in een stelsel, niet alleen</h2>
          <p className="mt-4 flex-1 text-tekst-secundair">
            Mooie missies, eerlijke tarieven en collega-sterren om mee te
            sparren. Je komt binnen via een vouch en bouwt aan je eigen
            constellation van mensen die voor je instaan.
          </p>
          <div className="mt-8">
            <Button href="/word-een-star" variant="secundair">
              Word een star
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
