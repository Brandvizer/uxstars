"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WachtlijstItem, WachtlijstStatus } from "@/lib/admin-data";
import {
  nodigWachtlijstDesignerUit,
  benaderWachtlijstOpdrachtgever,
  wijsWachtlijstAf,
} from "@/app/admin/(beveiligd)/actions";

const STATUS_LABEL: Record<WachtlijstStatus, string> = {
  nieuw: "Nieuw",
  uitgenodigd: "Uitgenodigd",
  benaderd: "Benaderd",
  afgewezen: "Afgewezen",
};

const STATUS_STIJL: Record<WachtlijstStatus, string> = {
  nieuw: "border-lijn text-tekst-secundair",
  uitgenodigd: "border-succes/50 text-succes",
  benaderd: "border-accent/50 text-accent",
  afgewezen: "border-lijn text-tekst-secundair/60 line-through",
};

export default function WachtlijstLijst({ items }: { items: WachtlijstItem[] }) {
  const router = useRouter();
  const [bezigId, setBezigId] = useState<string | null>(null);
  const [melding, setMelding] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const meld = (id: string, tekst: string) =>
    setMelding((m) => ({ ...m, [id]: tekst }));

  const uitnodigen = async (w: WachtlijstItem) => {
    setBezigId(w.id);
    const res = await nodigWachtlijstDesignerUit(w.id);
    setBezigId(null);
    if (!res.ok) return meld(w.id, "Er ging iets mis.");
    meld(
      w.id,
      res.gemaild ? "Uitnodiging gemaild ✓" : "Uitgenodigd (mail niet verstuurd)",
    );
    startTransition(() => router.refresh());
  };

  const benaderen = async (w: WachtlijstItem) => {
    setBezigId(w.id);
    const res = await benaderWachtlijstOpdrachtgever(w.id, w.email, w.naam);
    setBezigId(null);
    if (!res.ok) return meld(w.id, "Er ging iets mis.");
    meld(w.id, res.gemaild ? "Uitnodiging gemaild ✓" : "Benaderd (mail niet verstuurd)");
    startTransition(() => router.refresh());
  };

  const afwijzen = async (w: WachtlijstItem) => {
    setBezigId(w.id);
    const res = await wijsWachtlijstAf(w.id);
    setBezigId(null);
    if (!res.ok) return meld(w.id, "Er ging iets mis.");
    startTransition(() => router.refresh());
  };

  if (items.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-lijn bg-paneel px-6 py-10 text-center text-tekst-secundair">
        Nog geen aanmeldingen.
      </p>
    );
  }

  const knop =
    "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50";

  return (
    <ul className="mt-6 space-y-2">
      {items.map((w) => {
        const bezig = bezigId === w.id;
        const open = w.status === "nieuw";
        return (
          <li
            key={w.id}
            className="rounded-xl border border-lijn bg-paneel px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-medium text-tekst">{w.naam || w.email}</span>
                {w.naam && (
                  <span className="ml-2 text-sm text-tekst-secundair">{w.email}</span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    w.type === "designer"
                      ? "border-accent/40 text-accent"
                      : "border-lijn text-tekst-secundair"
                  }`}
                >
                  {w.type}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STIJL[w.status]}`}
                >
                  {STATUS_LABEL[w.status]}
                </span>
                <span className="text-xs text-tekst-secundair">
                  {new Date(w.created_at).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>

            {(open || melding[w.id]) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-lijn pt-3">
                {open && w.type === "designer" && (
                  <button
                    onClick={() => uitnodigen(w)}
                    disabled={bezig}
                    className={`${knop} bg-accent text-achtergrond hover:bg-accent-actief`}
                  >
                    {bezig ? "Bezig…" : "Uitnodigen (founder-vouch)"}
                  </button>
                )}
                {open && w.type === "opdrachtgever" && (
                  <button
                    onClick={() => benaderen(w)}
                    disabled={bezig}
                    className={`${knop} bg-accent text-achtergrond hover:bg-accent-actief`}
                  >
                    {bezig ? "Bezig…" : "Benaderen"}
                  </button>
                )}
                {open && (
                  <button
                    onClick={() => afwijzen(w)}
                    disabled={bezig}
                    className={`${knop} border border-lijn text-tekst-secundair hover:text-tekst`}
                  >
                    Afwijzen
                  </button>
                )}
                {melding[w.id] && (
                  <span className="text-sm text-tekst-secundair">{melding[w.id]}</span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
