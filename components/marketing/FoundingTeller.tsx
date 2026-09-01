"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { FoundingStatus } from "@/lib/founding";

/**
 * Toont hoeveel founding-plekken er nog vrij zijn (van de 100). Met `metCta`
 * verschijnt de knop naar de founding-aanmelding; zonder CTA is het puur de
 * teller (bijv. boven de aanmeld-stepper).
 */
export default function FoundingTeller({
  metCta = false,
  start,
}: {
  metCta?: boolean;
  start?: FoundingStatus;
}) {
  const [status, setStatus] = useState<FoundingStatus | null>(start ?? null);

  useEffect(() => {
    let actief = true;
    getSupabaseBrowser()
      .rpc("founding_status")
      .then(({ data }) => {
        if (actief && data) setStatus(data as FoundingStatus);
      });
    return () => {
      actief = false;
    };
  }, []);

  const limiet = status?.limiet ?? 100;
  const resterend = status?.resterend ?? 0;
  const bezet = status?.bezet ?? 0;
  const open = status ? status.open : true;
  const pct = Math.min(100, Math.round((bezet / limiet) * 100));

  return (
    <div className="w-full text-center">
      {status === null ? (
        <p className="text-sm text-tekst-secundair">Founding-plekken laden…</p>
      ) : (
        <>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            {open ? (
              <>
                Nog <span className="text-tekst">{resterend}</span> van {limiet}{" "}
                founding-plekken
              </>
            ) : (
              <>Alle {limiet} founding-plekken zijn vergeven</>
            )}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-achtergrond/80 ring-1 ring-lijn">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.max(3, pct)}%` }}
            />
          </div>

          {metCta &&
            (open ? (
              <Link
                href="/vroeg/aanmelden"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-achtergrond transition-all duration-200 hover:bg-accent-actief hover:shadow-[0_0_28px_rgba(245,185,65,0.35)]"
              >
                Claim je founding-plek
              </Link>
            ) : (
              <p className="mt-4 text-sm text-tekst-secundair">
                Het stelsel is voorlopig vol. Houd onze socials in de gaten voor de
                volgende ronde.
              </p>
            ))}
        </>
      )}
    </div>
  );
}
