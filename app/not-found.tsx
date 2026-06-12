import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-32 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
        404
      </p>
      <h1 className="mt-4 !text-[clamp(1.75rem,3vw+1rem,2.5rem)]">
        Deze ster bestaat niet (meer)
      </h1>
      <p className="mt-4 text-tekst-secundair">
        De pagina die je zoekt is uit het stelsel verdwenen.
      </p>
      <div className="mt-8">
        <Button href="/">Terug naar het stelsel</Button>
      </div>
    </div>
  );
}
