import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { Missie } from "@/lib/mock-data";

export default function MissieKaart({ missie }: { missie: Missie }) {
  const open = missie.status === "open";

  return (
    <article className="flex flex-col rounded-2xl border border-lijn bg-paneel p-6 transition-colors duration-300 ease-uit hover:border-accent/40 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">
          {missie.rol}
        </p>
        <Badge kleur={open ? "succes" : "neutraal"}>
          {open && <span className="h-1.5 w-1.5 rounded-full bg-succes" />}
          {open ? "Open" : "Gevuld"}
        </Badge>
      </div>

      <h3 className="mt-3">
        <Link
          href={`/missies/${missie.slug}`}
          className="transition-colors duration-200 hover:text-accent-actief"
        >
          {missie.titel}
        </Link>
      </h3>
      <p className="mt-3 flex-1 text-base text-tekst-secundair">
        {missie.intro}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge>{missie.locatie}</Badge>
        <Badge>{missie.urenPerWeek}</Badge>
        <Badge>{missie.tariefIndicatie}</Badge>
        <Badge>{missie.seniority}</Badge>
      </div>

      <div className="mt-6">
        <Link
          href={`/missies/${missie.slug}`}
          className="inline-flex items-center gap-2 font-semibold text-accent transition-colors duration-200 hover:text-accent-actief"
        >
          Bekijk de missie
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 stroke-current"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
