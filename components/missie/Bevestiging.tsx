import Button from "@/components/ui/Button";

const CALENDLY_URL = "https://calendly.com/uxstars/kennismaking";

export default function Bevestiging({ naam }: { naam: string }) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-accent">
          <path d="M12 2c3 2.5 4.5 6 4.5 9.5 0 1.4-.2 2.7-.6 3.9l2.6 2.6-1.4 3-3-1.4c-.7.3-1.4.4-2.1.4s-1.4-.1-2.1-.4l-3 1.4-1.4-3 2.6-2.6c-.4-1.2-.6-2.5-.6-3.9C7.5 8 9 4.5 12 2zm0 6a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      </div>
      <h2 className="mt-8">Missie gelanceerd 🚀</h2>
      <p className="mt-4 text-tekst-secundair">
        Dank je, {naam}. Je missie zweeft nu door het stelsel. We bekijken hem
        binnen één werkdag en nemen contact op zodra de eerste sterren
        oplichten.
      </p>
      <p className="mt-4 text-tekst-secundair">
        Liever direct schakelen? Plan meteen een korte kennismaking in.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Button href={CALENDLY_URL}>Plan een kennismaking</Button>
        <Button href="/" variant="secundair">
          Terug naar het stelsel
        </Button>
      </div>
    </div>
  );
}
