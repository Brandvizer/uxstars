import { getAanmeldingen } from "@/lib/admin-data";
import AanmeldingenLijst from "@/components/admin/AanmeldingenLijst";

export default async function AanmeldingenPage() {
  const aanmeldingen = await getAanmeldingen();
  return (
    <div>
      <h1 className="kop-3">Aanmeldingen</h1>
      <p className="mt-1 text-sm text-tekst-secundair">
        Sollicitaties van gevouchte designers (nog zonder account). Keur goed → er
        wordt een account aangemaakt en ze krijgen een welkomstmail om hun profiel
        af te ronden. Wijs af → ze krijgen een nette mail met jouw toelichting.
      </p>
      <div className="mt-6">
        <AanmeldingenLijst aanmeldingen={aanmeldingen} />
      </div>
    </div>
  );
}
