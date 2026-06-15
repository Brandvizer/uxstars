import type { Metadata } from "next";
import { getPubliekeLeden } from "@/lib/leden";
import Onthul from "@/components/ui/Onthul";

export const metadata: Metadata = {
  title: "Het stelsel",
  description:
    "De mensen achter UXSTARS — gevouchte UX-professionals die voor elkaar instaan. Zie wie wie in het stelsel bracht.",
};

// Publieke data uit Supabase: periodiek hervalideren (ISR).
export const revalidate = 300;

export default async function LedenPagina() {
  const leden = await getPubliekeLeden();

  return (
    <div className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
            Het stelsel
          </p>
          <h1 className="mt-4 !text-[clamp(2rem,4vw+0.5rem,3.5rem)]">
            De mensen die voor elkaar instaan
          </h1>
          <p className="mt-5 text-xl text-tekst-secundair">
            UXSTARS groeit van ster tot ster. Niemand komt binnen zonder dat een
            collega voor je instaat — daarom zie je hier ook wie wie vouchte.
          </p>
        </div>

        {leden.length === 0 ? (
          <p className="mt-16 text-tekst-secundair">
            Het stelsel begint net op te lichten. Binnenkort zie je hier de eerste
            sterren.
          </p>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leden.map((lid, i) => (
              <Onthul key={lid.id} delay={(i % 3) * 80} className="h-full">
                <article className="flex h-full flex-col rounded-2xl border border-lijn bg-paneel p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-lijn bg-achtergrond">
                      {lid.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={lid.foto_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl text-tekst-secundair">
                          {lid.naam.charAt(0)}
                        </div>
                      )}
                      {lid.beschikbaar && (
                        <span
                          className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-paneel bg-succes"
                          title="Beschikbaar"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg">{lid.naam}</h3>
                      <p className="truncate text-sm text-tekst-secundair">
                        {lid.specialisme} · {lid.seniority}
                      </p>
                    </div>
                  </div>

                  {lid.bio && (
                    <p className="mt-4 line-clamp-3 text-sm text-tekst-secundair">
                      {lid.bio}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-5 text-xs text-tekst-secundair">
                    {lid.gevouched_door && (
                      <span>
                        Gevouched door{" "}
                        <span className="text-tekst">{lid.gevouched_door}</span>
                      </span>
                    )}
                    {lid.aantal_vouches_gegeven > 0 && (
                      <span className="text-accent">
                        Vouchte {lid.aantal_vouches_gegeven}
                      </span>
                    )}
                  </div>
                </article>
              </Onthul>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
