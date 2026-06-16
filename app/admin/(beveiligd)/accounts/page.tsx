import { getAccounts } from "@/lib/accounts";
import AccountsLijst from "@/components/admin/AccountsLijst";

export default async function AccountsTab() {
  const accounts = await getAccounts();

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold">
        Accounts <span className="text-tekst-secundair">({accounts.length})</span>
      </h2>
      <p className="mt-2 text-tekst-secundair">
        Alle aangemaakte accounts. Verwijder test-accounts om schoon te testen —
        je eigen account en admin-accounts zijn beveiligd.
      </p>
      <div className="mt-6">
        <AccountsLijst accounts={accounts} />
      </div>
    </div>
  );
}
