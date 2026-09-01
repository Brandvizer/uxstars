import { getWachtlijst } from "@/lib/admin-data";

export default async function WachtlijstPage() {
  const lijst = await getWachtlijst();
  const designers = lijst.filter((w) => w.type === "designer").length;
  const opdrachtgevers = lijst.filter((w) => w.type === "opdrachtgever").length;

  return (
    <div>
      <h1 className="text-xl font-semibold">Wachtlijst</h1>
      <p className="mt-1 text-sm text-tekst-secundair">
        Pre-launch aanmeldingen via <span className="text-tekst">/vroeg</span>.
      </p>

      <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
        <div className="rounded-2xl border border-lijn bg-paneel p-5">
          <div className="text-3xl font-bold text-accent">{designers}</div>
          <div className="mt-1 text-sm text-tekst-secundair">designers</div>
        </div>
        <div className="rounded-2xl border border-lijn bg-paneel p-5">
          <div className="text-3xl font-bold text-accent">{opdrachtgevers}</div>
          <div className="mt-1 text-sm text-tekst-secundair">opdrachtgevers</div>
        </div>
      </div>

      {lijst.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-lijn bg-paneel px-6 py-10 text-center text-tekst-secundair">
          Nog geen aanmeldingen.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {lijst.map((w) => (
            <li
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lijn bg-paneel px-4 py-3"
            >
              <div className="min-w-0">
                <span className="font-medium text-tekst">
                  {w.naam || w.email}
                </span>
                {w.naam && (
                  <span className="ml-2 text-sm text-tekst-secundair">{w.email}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    w.type === "designer"
                      ? "border-accent/50 text-accent"
                      : "border-lijn text-tekst-secundair"
                  }`}
                >
                  {w.type}
                </span>
                <span className="text-xs text-tekst-secundair">
                  {new Date(w.created_at).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
