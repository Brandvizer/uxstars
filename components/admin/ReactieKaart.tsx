"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { stelVoor, bevestigPlaatsing } from "@/app/admin/(beveiligd)/actions";
import type { AdminReactie } from "@/lib/admin-data";

export default function ReactieKaart({ reactie }: { reactie: AdminReactie }) {
  const [bezig, setBezig] = useState<"" | "voorstellen" | "plaatsen">("");
  const [melding, setMelding] = useState<string | null>(null);

  const voorgesteld = reactie.status === "uitgenodigd";
  const geplaatst = reactie.missie_status === "gevuld";

  const voorstellen = async () => {
    setBezig("voorstellen");
    const r = await stelVoor(reactie.reactie_id);
    setBezig("");
    setMelding(r.ok ? "Voorgesteld — mail verstuurd ✓" : (r.fout ?? "Mislukt"));
  };

  const plaatsen = async () => {
    setBezig("plaatsen");
    const r = await bevestigPlaatsing(reactie.reactie_id);
    setBezig("");
    setMelding(r.ok ? "Plaatsing bevestigd ✓" : "Mislukt");
  };

  return (
    <article className="rounded-2xl border border-lijn bg-paneel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">
            {reactie.star.specialisme} · {reactie.star.seniority}
          </p>
          <h3 className="mt-1 text-lg">{reactie.star.naam}</h3>
          <p className="mt-1 text-sm text-tekst-secundair">
            reageerde op <span className="text-tekst">{reactie.missie_titel}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {geplaatst && <Badge kleur="succes">Geplaatst</Badge>}
          {voorgesteld && !geplaatst && <Badge kleur="accent">Voorgesteld</Badge>}
        </div>
      </div>

      {reactie.motivatie && (
        <p className="mt-4 text-tekst-secundair">&ldquo;{reactie.motivatie}&rdquo;</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {reactie.star.portfolio_url && (
          <a href={reactie.star.portfolio_url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-actief">
            Portfolio →
          </a>
        )}
        {reactie.star.linkedin_url && (
          <a href={reactie.star.linkedin_url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-actief">
            LinkedIn →
          </a>
        )}
      </div>

      {!geplaatst && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={voorstellen}
            disabled={bezig !== "" || !reactie.opdrachtgever_email}
            className="rounded-full border border-lijn bg-achtergrond px-5 py-2.5 text-sm font-semibold transition-colors duration-200 hover:border-tekst-secundair disabled:opacity-50"
            title={reactie.opdrachtgever_email ? "" : "Geen e-mailadres van de opdrachtgever"}
          >
            {bezig === "voorstellen" ? "Versturen…" : "Voorstellen aan opdrachtgever"}
          </button>
          <button
            type="button"
            onClick={plaatsen}
            disabled={bezig !== ""}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-achtergrond transition-colors duration-200 hover:bg-accent-actief disabled:opacity-50"
          >
            {bezig === "plaatsen" ? "Bezig…" : "Plaatsing bevestigen"}
          </button>
          {melding && <span className="text-sm text-tekst-secundair">{melding}</span>}
        </div>
      )}
    </article>
  );
}
