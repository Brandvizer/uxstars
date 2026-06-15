import BootstrapInvite from "@/components/admin/BootstrapInvite";
import KandidatenLijst from "@/components/admin/KandidatenLijst";
import { getVouchAanvragen } from "@/lib/admin-data";

export default async function UitnodigingenTab() {
  const aanvragen = await getVouchAanvragen();
  const aantalNieuw = aanvragen.filter((a) => a.status === "nieuw").length;

  return (
    <div className="max-w-2xl space-y-12">
      <div>
        <h2 className="text-xl font-semibold">
          Vouch-aanvragen{" "}
          <span className="text-tekst-secundair">({aantalNieuw} nieuw)</span>
        </h2>
        <p className="mt-2 text-tekst-secundair">
          Designers die zichzelf op de radar zetten. Geef je vouch — ze krijgen
          dan een uitnodiging — of wijs af.
        </p>
        <div className="mt-6">
          <KandidatenLijst aanvragen={aanvragen} />
        </div>
      </div>

      <div className="border-t border-lijn pt-10">
        <h2 className="text-xl font-semibold">Handmatige uitnodiging</h2>
        <p className="mt-2 text-tekst-secundair">
          Nodig iemand rechtstreeks uit met een eenmalige link.
        </p>
        <div className="mt-6">
          <BootstrapInvite />
        </div>
      </div>
    </div>
  );
}
