export default function AdminHome() {
  return (
    <div>
      <h1 className="!text-[clamp(1.75rem,3vw+1rem,2.5rem)]">Missiecontrole</h1>
      <p className="mt-3 max-w-2xl text-tekst-secundair">
        Je bent ingelogd. Hier beheer je straks de drie stromen van het stelsel.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { titel: "Missies in review", tekst: "Ingediende missies goedkeuren naar open." },
          { titel: "Reacties", tekst: "Sterren voorstellen en plaatsingen bevestigen." },
          { titel: "Star-aanvragen", tekst: "Nieuwe sterren beoordelen." },
        ].map((kaart) => (
          <div
            key={kaart.titel}
            className="rounded-2xl border border-lijn bg-paneel p-6"
          >
            <h3 className="text-lg">{kaart.titel}</h3>
            <p className="mt-2 text-sm text-tekst-secundair">{kaart.tekst}</p>
            <p className="mt-4 text-xs uppercase tracking-wider text-tekst-secundair/60">
              Binnenkort
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
