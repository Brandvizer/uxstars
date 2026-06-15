import { getAdminReacties } from "@/lib/admin-data";
import ReactieKaart from "@/components/admin/ReactieKaart";

export default async function ReactiesTab() {
  const reacties = await getAdminReacties();

  return (
    <div>
      <h2 className="text-xl font-semibold">
        Reacties{" "}
        <span className="text-tekst-secundair">({reacties.length})</span>
      </h2>

      {reacties.length === 0 ? (
        <p className="mt-6 text-tekst-secundair">
          Nog geen reacties op missies.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {reacties.map((reactie) => (
            <ReactieKaart key={reactie.reactie_id} reactie={reactie} />
          ))}
        </div>
      )}
    </div>
  );
}
