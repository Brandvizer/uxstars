import StarField from "@/components/constellation/StarField";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <StarField className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-achtergrond to-transparent" />

      {/* pointer-events-none zodat hover op de sterren achter de tekst blijft werken */}
      <div className="pointer-events-none relative mx-auto flex min-h-[85vh] max-w-6xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <p className="pointer-events-none mb-6 text-sm font-semibold uppercase tracking-[0.25em] text-accent">
          Het sterrenstelsel van UX-talent
        </p>
        <h1 className="pointer-events-none max-w-4xl">
          Elke designer een ster.
          <br />
          Elke opdracht een missie.
        </h1>
        <p className="pointer-events-none mt-6 max-w-2xl text-lg text-tekst-secundair sm:text-xl">
          UXSTARS is een netwerk van gevouchte UX-professionals. Geen cv-stapels,
          maar sterren die voor elkaar instaan — en binnen dagen aan boord zijn.
        </p>
        <div className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button href="/missie-plaatsen" size="lg">
            Plaats een missie
          </Button>
          <Button href="/word-een-star" variant="secundair" size="lg">
            Word een star
          </Button>
        </div>
      </div>
    </section>
  );
}
