import { getWachtlijst } from "@/lib/admin-data";
import WachtlijstLijst from "@/components/admin/WachtlijstLijst";

export default async function WachtlijstPage() {
  const lijst = await getWachtlijst();
  const designers = lijst.filter((w) => w.type === "designer").length;
  const opdrachtgevers = lijst.filter((w) => w.type === "opdrachtgever").length;
  const nieuw = lijst.filter((w) => w.status === "nieuw").length;

  const tegels = [
    { label: "designers", waarde: designers },
    { label: "opdrachtgevers", waarde: opdrachtgevers },
    { label: "nog te verwerken", waarde: nieuw },
  ];

  return (
    <div>
      <h1 className="kop-3">Wachtlijst</h1>
      <p className="mt-1 text-sm text-tekst-secundair">
        Pre-launch aanmeldingen via <span className="text-tekst">/vroeg</span>.
        Nodig designers uit als founder (vouch + volledige aanmelding) of wijs af.
      </p>

      <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
        {tegels.map((t) => (
          <div key={t.label} className="rounded-2xl border border-lijn bg-paneel p-5">
            <div className="text-3xl font-bold text-accent">{t.waarde}</div>
            <div className="mt-1 text-sm text-tekst-secundair">{t.label}</div>
          </div>
        ))}
      </div>

      <WachtlijstLijst items={lijst} />
    </div>
  );
}
