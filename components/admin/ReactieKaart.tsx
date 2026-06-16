"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { stelVoor, bevestigPlaatsing } from "@/app/admin/(beveiligd)/actions";
import type { AdminReactie } from "@/lib/admin-data";

const veld =
  "w-full rounded-lg border border-lijn bg-paneel px-3 py-2 text-sm text-tekst focus:border-accent focus:outline-none";

export default function ReactieKaart({ reactie }: { reactie: AdminReactie }) {
  const [bezig, setBezig] = useState<"" | "voorstellen" | "plaatsen">("");
  const [melding, setMelding] = useState<string | null>(null);
  const [plaatsOpen, setPlaatsOpen] = useState(false);
  const [dealType, setDealType] = useState<"direct" | "via_uxstars">("direct");
  const [sterTarief, setSterTarief] = useState("");
  const [klantTarief, setKlantTarief] = useState("");

  const voorgesteld = reactie.status === "uitgenodigd";
  const geplaatst = reactie.missie_status === "gevuld";

  const marge =
    sterTarief && klantTarief
      ? Number(klantTarief) - Number(sterTarief)
      : null;
  const margeGeldig = marge !== null && !Number.isNaN(marge);

  const voorstellen = async () => {
    setBezig("voorstellen");
    const r = await stelVoor(reactie.reactie_id);
    setBezig("");
    setMelding(r.ok ? "Voorgesteld — mail verstuurd ✓" : (r.fout ?? "Mislukt"));
  };

  const plaatsen = async () => {
    setBezig("plaatsen");
    const r = await bevestigPlaatsing(
      reactie.reactie_id,
      dealType,
      dealType === "via_uxstars" && sterTarief ? Number(sterTarief) : undefined,
      dealType === "via_uxstars" && klantTarief ? Number(klantTarief) : undefined,
    );
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
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={voorstellen}
              disabled={bezig !== "" || !reactie.opdrachtgever_email}
              className="rounded-full border border-lijn bg-achtergrond px-5 py-2.5 text-sm font-semibold transition-colors duration-200 hover:border-tekst-secundair disabled:opacity-50"
              title={reactie.opdrachtgever_email ? "" : "Geen e-mailadres van de opdrachtgever"}
            >
              {bezig === "voorstellen" ? "Versturen…" : "Voorstellen aan opdrachtgever"}
            </button>
            {!plaatsOpen && (
              <button
                type="button"
                onClick={() => setPlaatsOpen(true)}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-achtergrond transition-colors duration-200 hover:bg-accent-actief"
              >
                Plaatsen…
              </button>
            )}
            {melding && <span className="text-sm text-tekst-secundair">{melding}</span>}
          </div>

          {plaatsOpen && (
            <div className="mt-4 rounded-xl border border-lijn bg-achtergrond p-4">
              <p className="mb-2 text-sm font-semibold">Deal-type</p>
              <div className="flex gap-2">
                {(["direct", "via_uxstars"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDealType(t)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                      dealType === t
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-lijn text-tekst-secundair hover:text-tekst"
                    }`}
                  >
                    {t === "direct" ? "Direct" : "Via UXSTARS"}
                  </button>
                ))}
              </div>

              {dealType === "via_uxstars" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="text-sm">
                    <span className="mb-1 block text-tekst-secundair">Stertarief €/u</span>
                    <input
                      type="number"
                      value={sterTarief}
                      onChange={(e) => setSterTarief(e.target.value)}
                      placeholder="90"
                      className={veld}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-tekst-secundair">Klanttarief €/u</span>
                    <input
                      type="number"
                      value={klantTarief}
                      onChange={(e) => setKlantTarief(e.target.value)}
                      placeholder="112"
                      className={veld}
                    />
                  </label>
                  <div className="text-sm">
                    <span className="mb-1 block text-tekst-secundair">Marge</span>
                    <div className="rounded-lg border border-lijn bg-paneel px-3 py-2 font-semibold text-accent">
                      {margeGeldig ? `€ ${marge}/u` : "—"}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={plaatsen}
                  disabled={
                    bezig !== "" ||
                    (dealType === "via_uxstars" && (!margeGeldig || marge! < 0))
                  }
                  className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-achtergrond transition-colors duration-200 hover:bg-accent-actief disabled:opacity-50"
                >
                  {bezig === "plaatsen" ? "Bezig…" : "Bevestig plaatsing"}
                </button>
                <button
                  type="button"
                  onClick={() => setPlaatsOpen(false)}
                  disabled={bezig !== ""}
                  className="text-sm text-tekst-secundair transition-colors duration-200 hover:text-tekst"
                >
                  Annuleren
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
