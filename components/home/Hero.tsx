import SterrenVeld from "@/components/constellation/SterrenVeld";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <SterrenVeld className="veld-in absolute inset-0" />
      {/* Zachte radiale verdonkering achter de tekst: koppen blijven leesbaar,
          sterren aan de randen blijven helder. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 52%, rgba(10,14,26,0.72), transparent 72%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-achtergrond to-transparent" />

      {/* pointer-events-none zodat hover op de sterren achter de tekst blijft werken */}
      <div className="pointer-events-none relative mx-auto flex min-h-[88vh] max-w-6xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <p
          className="rijs-in mb-6 flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.25em] text-accent"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="h-px w-6 bg-accent/50" />
          Het sterrenstelsel van UX-talent
          <span className="h-px w-6 bg-accent/50" />
        </p>
        <h1
          className="rijs-in max-w-4xl text-balance"
          style={{ animationDelay: "0.22s" }}
        >
          Elke designer een ster.
          <br />
          Elke opdracht een missie.
        </h1>
        <p
          className="rijs-in mt-6 max-w-2xl text-lg text-tekst-secundair sm:text-xl"
          style={{ animationDelay: "0.36s" }}
        >
          UXSTARS is een netwerk van gevouchte UX-professionals. Geen cv-stapels,
          maar sterren die voor elkaar instaan — en binnen dagen aan boord zijn.
        </p>
        <div
          className="rijs-in pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row"
          style={{ animationDelay: "0.52s" }}
        >
          <Button href="/missie-plaatsen" size="lg">
            Plaats een missie
          </Button>
          <Button href="/word-een-star" variant="secundair" size="lg">
            Word een star
          </Button>
        </div>
      </div>

      {/* Scroll-hint */}
      <div
        className="rijs-in pointer-events-none absolute inset-x-0 bottom-7 flex justify-center"
        style={{ animationDelay: "0.9s" }}
      >
        <svg
          viewBox="0 0 24 24"
          className="zweef h-5 w-5 stroke-tekst-secundair"
          fill="none"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
