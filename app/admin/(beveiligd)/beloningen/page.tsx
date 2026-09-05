import { getAdminBeloningen } from "@/lib/admin-data";
import BeloningenLijst from "@/components/admin/BeloningenLijst";
import { AANBRENGEN } from "@/lib/aanbrengen";

export default async function BeloningenTab() {
  const beloningen = await getAdminBeloningen();
  const open = beloningen.filter((b) => b.status === "open").length;

  return (
    <div className="max-w-2xl">
      <h2 className="kop-3">
        Aanbrengbeloningen{" "}
        <span className="text-tekst-secundair">({open} open)</span>
      </h2>
      <p className="mt-2 text-tekst-secundair">
        Sterren die een betalende opdrachtgever binnenbrachten krijgen{" "}
        {AANBRENGEN.bedragTekst} en een extra vouch. De beloning ontstaat
        automatisch bij de eerste betaalde factuur; de ster stuurt een factuur
        met het kenmerk. Na betaling zet je hem hier op uitbetaald.
      </p>
      <div className="mt-6">
        <BeloningenLijst beloningen={beloningen} />
      </div>
    </div>
  );
}
