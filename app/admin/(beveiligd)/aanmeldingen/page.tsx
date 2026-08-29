import { getWachtendeSterren } from "@/lib/admin-data";
import AanmeldingenLijst from "@/components/admin/AanmeldingenLijst";

export default async function AanmeldingenPage() {
  const aanmeldingen = await getWachtendeSterren();
  return (
    <div>
      <h1 className="text-xl font-semibold">Aanmeldingen</h1>
      <p className="mt-1 text-sm text-tekst-secundair">
        Gevouchte designers die op je goedkeuring wachten. Keur goed → ze worden
        actief en krijgen een welkomstmail. Wijs af → ze krijgen een nette mail
        met jouw toelichting.
      </p>
      <div className="mt-6">
        <AanmeldingenLijst aanmeldingen={aanmeldingen} />
      </div>
    </div>
  );
}
