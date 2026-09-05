import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { Missie } from "@/lib/mock-data";

function LogoThumb({ logo, naam }: { logo?: string | null; naam: string }) {
  const initiaal = naam.trim().charAt(0).toUpperCase() || "✦";
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-full w-full object-contain" />
      ) : (
        <span className="text-xl font-bold text-achtergrond">{initiaal}</span>
      )}
    </div>
  );
}

export default function MissieKaart({ missie }: { missie: Missie }) {
  const open = missie.status === "open";

  return (
    <article className="flex flex-col rounded-2xl border border-lijn bg-paneel p-6 transition-colors duration-300 ease-uit hover:border-accent/40 sm:p-8">
      <div className="flex items-start gap-4">
        <LogoThumb logo={missie.logo} naam={missie.opdrachtgever} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="label text-accent">
              {missie.rol}
            </p>
            <Badge kleur={open ? "succes" : "neutraal"}>
              {open && <span className="h-1.5 w-1.5 rounded-full bg-succes" />}
              {open ? "Open" : "Gevuld"}
            </Badge>
          </div>
          <h3 className="mt-2">
            <Link
              href={`/missies/${missie.slug}`}
              className="transition-colors duration-200 hover:text-accent-actief"
            >
              {missie.titel}
            </Link>
          </h3>
          {missie.opdrachtgever && (
            <p className="mt-1 text-sm text-tekst-secundair">
              {missie.opdrachtgever}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 flex-1 text-base text-tekst-secundair">{missie.intro}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {/* Lege waarden geven geen leeg pilletje */}
        {[missie.locatie, missie.urenPerWeek, missie.tariefIndicatie, missie.seniority]
          .filter((v) => v && v.trim() !== "")
          .map((v) => (
            <Badge key={v}>{v}</Badge>
          ))}
      </div>

      <div className="mt-6">
        <Link
          href={`/missies/${missie.slug}`}
          className="inline-flex items-center font-semibold text-accent transition-colors duration-200 hover:text-accent-actief"
        >
          Bekijk de missie
        </Link>
      </div>
    </article>
  );
}
