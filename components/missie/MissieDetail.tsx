import Badge from "@/components/ui/Badge";
import type { Missie } from "@/lib/mock-data";
import MissieReactie from "@/components/missie/MissieReactie";

export default function MissieDetail({ missie }: { missie: Missie }) {
  const open = missie.status === "open";
  const initiaal = missie.opdrachtgever.trim().charAt(0).toUpperCase() || "✦";

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
          {missie.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={missie.logo}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-2xl font-bold text-achtergrond">
              {initiaal}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge kleur={open ? "succes" : "neutraal"}>
            {open && <span className="h-1.5 w-1.5 rounded-full bg-succes" />}
            {open ? "Open missie" : "Gevuld"}
          </Badge>
          <span className="text-sm text-tekst-secundair">
            {missie.opdrachtgever}
          </span>
        </div>
      </div>

      <h1 className="mt-6">
        {missie.titel}
      </h1>
      <p className="mt-4 text-tekst-secundair tekst-intro">{missie.intro}</p>

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
          <MissieReactie missieId={missie.id} />
        </div>
      )}
    </article>
  );
}
