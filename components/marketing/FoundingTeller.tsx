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
      .then(({ data, error }) => {
        if (!actief) return;
        if (error) {
          // Bijv. migratie nog niet toegepast: val terug op de standaard
          // (100 plekken open) in plaats van eindeloos "laden…" te tonen.
          console.error("founding_status mislukt:", error.message);
          setStatus({ limiet: 100, bezet: 0, resterend: 100, open: true });
          return;
        }
        if (data) setStatus(data as FoundingStatus);
      });
    return () => {
      actief = false;
    };
  }, []);

  const limiet = status?.limiet ?? 100;
  const resterend = status?.resterend ?? 0;
  const open = status ? status.open : true;

  return (
    <div className="w-full text-center">
      {status === null ? (
        <p className="text-base text-tekst-secundair">Founding-plekken laden…</p>
      ) : (
        <>
          <p className="text-base text-tekst-secundair">
            {open ? (
              <>
                Nog <span className="font-semibold text-tekst">{resterend}</span> van de{" "}
                {limiet} founding-plekken vrij.
              </>
            ) : (
              <>Alle {limiet} founding-plekken zijn vergeven.</>
            )}
          </p>

          {metCta &&
            (open ? (
              <Link
                href="/vroeg/aanmelden"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-achtergrond transition-all duration-200 hover:bg-accent-actief hover:shadow-[0_0_28px_rgba(245,185,65,0.35)]"
              >
                Claim je founding-plek
              </Link>
            ) : (
              <p className="mt-4 text-base text-tekst-secundair">
                Het stelsel is voorlopig vol. Houd onze socials in de gaten voor de
                volgende ronde.
              </p>
            ))}
        </>
      )}
    </div>
  );
}
