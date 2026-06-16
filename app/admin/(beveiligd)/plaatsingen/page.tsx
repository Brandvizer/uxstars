import { getAdminPlaatsingen } from "@/lib/admin-data";
import PlaatsingenLijst from "@/components/admin/PlaatsingenLijst";

export default async function PlaatsingenTab() {
  const plaatsingen = await getAdminPlaatsingen();
  const viaActief = plaatsingen.filter(
    (p) => p.deal_type === "via_uxstars" && p.contract_status !== "afgerond",
  ).length;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold">
        Plaatsingen{" "}
        <span className="text-tekst-secundair">({plaatsingen.length})</span>
      </h2>
      <p className="mt-2 text-tekst-secundair">
        Deal-type, tarieven en marge per plaatsing — en de contractstatus van de
        Via-UXSTARS-deals.
        {viaActief > 0 && ` ${viaActief} lopend(e) Via-UXSTARS-contract(en).`}
      </p>
      <div className="mt-6">
        <PlaatsingenLijst plaatsingen={plaatsingen} />
      </div>
    </div>
  );
}
