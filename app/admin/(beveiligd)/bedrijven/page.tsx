import { getAdminBedrijven } from "@/lib/admin-data";
import BedrijvenLijst from "@/components/admin/BedrijvenLijst";

export default async function BedrijvenTab() {
  const bedrijven = await getAdminBedrijven();
  const wachtend = bedrijven.filter(
    (b) =>
      b.heeft_account &&
      (b.membership_status === "geen" || b.membership_status === "verlopen"),
  ).length;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold">
        Bedrijven{" "}
        <span className="text-tekst-secundair">({bedrijven.length})</span>
      </h2>
      <p className="mt-2 text-tekst-secundair">
        Beheer membership — handmatig activeren tot Mollie eraan zit.
        {wachtend > 0 && ` ${wachtend} met account wachten op activatie.`}
      </p>
      <div className="mt-6">
        <BedrijvenLijst bedrijven={bedrijven} />
      </div>
    </div>
  );
}
