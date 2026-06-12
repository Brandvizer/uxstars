import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { Missie } from "@/lib/mock-data";

export default function MissieDetail({ missie }: { missie: Missie }) {
  const open = missie.status === "open";

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge kleur={open ? "succes" : "neutraal"}>
          {open && <span className="h-1.5 w-1.5 rounded-full bg-succes" />}
          {open ? "Open missie" : "Gevuld"}
        </Badge>
        <span className="text-sm text-tekst-secundair">
          {missie.opdrachtgever}
        </span>
      </div>

      <h1 className="mt-6 !text-[clamp(1.75rem,3vw+1rem,3rem)]">
        {missie.titel}
      </h1>
      <p className="mt-4 text-xl text-tekst-secundair">{missie.intro}</p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Badge>{missie.rol}</Badge>
        <Badge>{missie.locatie}</Badge>
        <Badge>{missie.urenPerWeek}</Badge>
        <Badge>{missie.tariefIndicatie}</Badge>
        <Badge>{missie.seniority}</Badge>
      </div>

      <div className="mt-10 space-y-5 border-t border-lijn pt-10">
        {missie.omschrijving.map((alinea) => (
          <p key={alinea.slice(0, 32)} className="text-tekst-secundair">
            {alinea}
          </p>
        ))}
      </div>

      {open && (
        <div className="mt-12 rounded-2xl border border-lijn bg-paneel p-8">
          <h3>Is dit jouw missie?</h3>
          <p className="mt-2 text-tekst-secundair">
            Reageren kan in fase één via e-mail. Vertel kort waarom deze missie
            bij je past — een ster uit het netwerk neemt contact op.
          </p>
          <div className="mt-6">
            <Button
              href={`mailto:hallo@uxstars.nl?subject=Reactie op missie: ${encodeURIComponent(missie.titel)}`}
            >
              Reageer op deze missie
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
