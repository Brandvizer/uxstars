import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-32 text-center sm:px-6">
      <p className="label text-accent">
        404
      </p>
      <h1 className="mt-4 kop-2">
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
