"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { verwijderAccount } from "@/app/admin/(beveiligd)/actions";
import type { Account } from "@/lib/accounts";

function rolBadge(rol: Account["rol"]) {
  if (rol === "admin") return <Badge kleur="accent">Admin</Badge>;
  if (rol === "ster") return <Badge kleur="succes">Ster</Badge>;
  if (rol === "bedrijf") return <Badge kleur="accent">Bedrijf</Badge>;
  return <Badge>Leeg</Badge>;
}

function Rij({
  account,
  onWeg,
}: {
  account: Account;
  onWeg: (id: string) => void;
}) {
  const [bevestig, setBevestig] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const beschermd = account.rol === "admin";

  const verwijder = async () => {
    setBezig(true);
    setFout(null);
    const r = await verwijderAccount(account.id);
    setBezig(false);
    if (r.ok) onWeg(account.id);
    else {
      setFout(r.fout ?? "Mislukt");
      setBevestig(false);
    }
  };

  return (
    <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lijn bg-paneel px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {rolBadge(account.rol)}
          <span className="truncate font-semibold">
            {account.naam ?? account.email}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-tekst-secundair">
          {account.email}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {fout && <span className="text-sm text-accent-actief">{fout}</span>}
        {beschermd ? (
          <span className="text-sm text-tekst-secundair">beveiligd</span>
        ) : !bevestig ? (
          <button
            type="button"
            onClick={() => setBevestig(true)}
            className="text-sm text-tekst-secundair transition-colors duration-200 hover:text-red-400"
          >
            Verwijderen
          </button>
        ) : (
          <span className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={verwijder}
              disabled={bezig}
              className="rounded-full bg-red-500 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:opacity-50"
            >
              {bezig ? "Bezig…" : "Zeker weten?"}
            </button>
            <button
              type="button"
              onClick={() => setBevestig(false)}
              disabled={bezig}
              className="text-tekst-secundair transition-colors duration-200 hover:text-tekst"
            >
              Annuleren
            </button>
          </span>
        )}
      </div>
    </article>
  );
}

export default function AccountsLijst({ accounts }: { accounts: Account[] }) {
  const [lijst, setLijst] = useState<Account[]>(accounts);
  const onWeg = (id: string) =>
    setLijst((l) => l.filter((a) => a.id !== id));

  if (lijst.length === 0) {
    return <p className="text-tekst-secundair">Geen accounts.</p>;
  }
  return (
    <div className="space-y-3">
      {lijst.map((a) => (
        <Rij key={a.id} account={a} onWeg={onWeg} />
      ))}
    </div>
  );
}
