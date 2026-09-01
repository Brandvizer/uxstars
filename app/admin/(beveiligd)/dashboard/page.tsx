import { getDashboardStats } from "@/lib/admin-data";

function pct(deel: number, geheel: number): string {
  if (!geheel) return "—";
  return `${Math.round((deel / geheel) * 100)}%`;
}

export default async function DashboardPage() {
  const s = await getDashboardStats();

  if (!s) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-6 rounded-2xl border border-lijn bg-paneel px-6 py-10 text-center text-tekst-secundair">
          Cijfers zijn nu even niet beschikbaar.
        </p>
      </div>
    );
  }

  const kpis = [
    { label: "Op de wachtlijst", waarde: s.wachtlijst.totaal, sub: `+${s.wachtlijst.laatste7} deze week` },
    { label: "Actieve sterren", waarde: s.sterren.actief, sub: `${s.sterren.totaal} totaal` },
    { label: "Open missies", waarde: s.missies.open, sub: `${s.missies.totaal} totaal` },
    { label: "Opdrachtgevers", waarde: s.opdrachtgevers.totaal, sub: `${s.opdrachtgevers.membership_actief} betalend` },
  ];

  // Trechter van de wachtlijst-aanmeldingen.
  const verwerkt = s.wachtlijst.uitgenodigd + s.wachtlijst.benaderd;
  const trechter = [
    { label: "Aangemeld (wachtlijst)", waarde: s.wachtlijst.totaal, van: null as number | null },
    { label: "Uitgenodigd / benaderd", waarde: verwerkt, van: s.wachtlijst.totaal },
    { label: "Aanmelding ingediend", waarde: s.aanmeldingen.totaal, van: verwerkt },
    { label: "Actief lid geworden", waarde: s.aanmeldingen.goedgekeurd, van: s.aanmeldingen.totaal },
  ];

  const maxReeks = Math.max(1, ...s.reeks.map((r) => r.aantal));
  const nl = (d: string) =>
    new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-tekst-secundair">
          De belangrijkste cijfers in één oogopslag.
        </p>
      </div>

      {/* KPI-tegels */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-lijn bg-paneel p-5">
            <div className="text-3xl font-bold text-tekst">{k.waarde}</div>
            <div className="mt-1 text-sm font-medium text-tekst-secundair">{k.label}</div>
            <div className="mt-0.5 text-xs text-tekst-secundair/70">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Aanmeldingen per dag (laatste 30 dagen) */}
      <section className="rounded-2xl border border-lijn bg-paneel p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Aanmeldingen per dag</h2>
          <span className="text-sm text-tekst-secundair">
            {s.wachtlijst.laatste30} in 30 dagen
          </span>
        </div>
        <div className="mt-5 flex h-32 items-end gap-1">
          {s.reeks.map((r) => (
            <div
              key={r.datum}
              className="group relative flex-1"
              style={{ height: "100%" }}
            >
              <div
                className="absolute bottom-0 w-full rounded-t bg-accent/70 transition-colors group-hover:bg-accent"
                style={{ height: `${Math.max(3, (r.aantal / maxReeks) * 100)}%` }}
                title={`${nl(r.datum)}: ${r.aantal}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-tekst-secundair/70">
          <span>{s.reeks.length > 0 && nl(s.reeks[0].datum)}</span>
          <span>vandaag</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trechter */}
        <section className="rounded-2xl border border-lijn bg-paneel p-6">
          <h2 className="font-semibold">Trechter</h2>
          <p className="mt-1 text-sm text-tekst-secundair">
            Van aanmelding naar actief lid.
          </p>
          <ul className="mt-5 space-y-3">
            {trechter.map((t) => {
              const breedte = s.wachtlijst.totaal
                ? Math.max(6, (t.waarde / Math.max(1, s.wachtlijst.totaal)) * 100)
                : 6;
              return (
                <li key={t.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-tekst">{t.label}</span>
                    <span className="text-tekst-secundair">
                      <span className="font-semibold text-tekst">{t.waarde}</span>
                      {t.van !== null && (
                        <span className="ml-2 text-xs">{pct(t.waarde, t.van)}</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-achtergrond">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${breedte}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Verdeling + statussen */}
        <section className="rounded-2xl border border-lijn bg-paneel p-6">
          <h2 className="font-semibold">Wachtlijst</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Cijfer label="Designers" waarde={s.wachtlijst.designers} />
            <Cijfer label="Opdrachtgevers" waarde={s.wachtlijst.opdrachtgevers} />
            <Cijfer label="Nog te verwerken" waarde={s.wachtlijst.nieuw} accent />
            <Cijfer label="Afgewezen" waarde={s.wachtlijst.afgewezen} />
          </div>

          <h2 className="mt-6 font-semibold">Aanmeldingen (portfolio)</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Cijfer label="Nieuw" waarde={s.aanmeldingen.nieuw} accent />
            <Cijfer label="Goedgekeurd" waarde={s.aanmeldingen.goedgekeurd} />
            <Cijfer label="Afgewezen" waarde={s.aanmeldingen.afgewezen} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Cijfer({
  label,
  waarde,
  accent,
}: {
  label: string;
  waarde: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-lijn bg-achtergrond px-4 py-3">
      <div className={`text-2xl font-bold ${accent ? "text-accent" : "text-tekst"}`}>
        {waarde}
      </div>
      <div className="mt-0.5 text-xs text-tekst-secundair">{label}</div>
    </div>
  );
}
