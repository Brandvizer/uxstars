import { getAdminBedrijfLeads } from "@/lib/admin-data";
import LeadsLijst from "@/components/admin/LeadsLijst";

export default async function LeadsTab() {
  const leads = await getAdminBedrijfLeads();
  const nieuw = leads.filter((l) => l.status === "nieuw").length;

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold">
        Opdrachtgever-leads{" "}
        <span className="text-tekst-secundair">({nieuw} nieuw)</span>
      </h2>
      <p className="mt-2 text-tekst-secundair">
        Opdrachtgevers die sterren binnenbrachten. Volg op en zet de status —
        van <span className="text-tekst">nieuw</span> tot{" "}
        <span className="text-tekst">binnen</span>.
      </p>
      <div className="mt-6">
        <LeadsLijst leads={leads} />
      </div>
    </div>
  );
}
