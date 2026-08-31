"use client";

import { useState } from "react";
import VouchAanmelding from "@/components/auth/VouchAanmelding";

/** Self-request: dezelfde aanmeld-stepper als bij een netwerk-vouch, maar zonder
 *  token. Belandt in dezelfde admin-review. */
export default function VouchAanvraag() {
  const [klaar, setKlaar] = useState(false);

  if (klaar) {
    return (
      <div className="rounded-2xl border border-succes/40 bg-paneel p-8 text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-succes">
          Aanmelding binnen ✦
        </p>
        <h3 className="mt-3 text-xl font-semibold">Bedankt — we bekijken je werk</h3>
        <p className="mt-3 text-tekst-secundair">
          Ons team beoordeelt je aanmelding. Bij een match krijg je een mail om je
          account af te ronden. Een menselijke check hoort bij een gevoucht
          netwerk.
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center lg:justify-start">
      <VouchAanmelding token="" onKlaar={() => setKlaar(true)} />
    </div>
  );
}
