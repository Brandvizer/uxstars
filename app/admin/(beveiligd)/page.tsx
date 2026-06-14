import Badge from "@/components/ui/Badge";
import { getReviewMissies } from "@/lib/admin-data";
import { keurMissieGoed } from "./actions";

export default async function MissiesInReview() {
  const missies = await getReviewMissies();

  return (
    <div>
      <h2 className="text-xl font-semibold">
        Missies in review{" "}
        <span className="text-tekst-secundair">({missies.length})</span>
      </h2>

      {missies.length === 0 ? (
        <p className="mt-6 text-tekst-secundair">
          Geen missies wachten op beoordeling.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {missies.map((missie) => (
            <article
              key={missie.id}
              className="rounded-2xl border border-lijn bg-paneel p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">
                    {missie.rol}
                  </p>
                  <h3 className="mt-1 text-lg">{missie.titel}</h3>
                  {missie.opdrachtgever_label && (
                    <p className="mt-1 text-sm text-tekst-secundair">
                      {missie.opdrachtgever_label}
                    </p>
                  )}
                </div>
                <form action={keurMissieGoed.bind(null, missie.id)}>
                  <button
                    type="submit"
                    className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-achtergrond transition-colors duration-200 hover:bg-accent-actief"
                  >
                    Goedkeuren → open
                  </button>
                </form>
              </div>

              {missie.intro && (
                <p className="mt-4 text-tekst-secundair">{missie.intro}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {missie.locatie && <Badge>{missie.locatie}</Badge>}
                {missie.uren_per_week && <Badge>{missie.uren_per_week}</Badge>}
                {missie.tarief_indicatie && (
                  <Badge>{missie.tarief_indicatie}</Badge>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
