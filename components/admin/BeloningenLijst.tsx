"use client";

import { useState } from "react";
import { markeerBeloningUitbetaald } from "@/app/admin/(beveiligd)/actions";
import type { AdminBeloning } from "@/lib/admin-data";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function euro(cent: number) {
  return "€" + (cent / 100).toLocaleString("nl-NL", { maximumFractionDigits: 0 });
}

function datum(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
}

function Kaart({ beloning }: { beloning: AdminBeloning }) {
  const [status, setStatus] = useState(beloning.status);
  const [bezig, setBezig] = useState(false);

  const uitbetaald = async () => {
    setBezig(true);
    const r = await markeerBeloningUitbetaald(beloning.id);
    setBezig(false);
    if (r.ok) setStatus("uitbetaald");
  };

  return (
    <article className="rounded-2xl border border-lijn bg-paneel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="kop-3">{beloning.ster_naam}</h3>
          <p className="mt-1 text-sm text-tekst-secundair">
            bracht <span className="text-tekst">{beloning.bedrijf_naam}</span> binnen ·{" "}
            {beloning.ster_email ?? "geen e-mail"}
          </p>
          <p className="mt-2 text-sm text-tekst-secundair">
            Kenmerk <span className="font-mono text-tekst">{beloning.kenmerk}</span> ·{" "}
            betalend sinds {datum(beloning.created_at)}
            {status === "uitbetaald" && beloning.uitbetaald_op
              ? ` · uitbetaald ${datum(beloning.uitbetaald_op)}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold">{euro(beloning.bedrag_cent)}</span>
          {status === "uitbetaald" ? (
            <Badge kleur="succes">Uitbetaald</Badge>
          ) : (
            <Button type="button" size="sm" onClick={uitbetaald} disabled={bezig}>
              {bezig ? "Bezig…" : "Markeer uitbetaald"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function BeloningenLijst({ beloningen }: { beloningen: AdminBeloning[] }) {
  if (beloningen.length === 0) {
    return (
      <p className="rounded-2xl border border-lijn bg-paneel p-6 text-tekst-secundair">
        Nog geen beloningen. Zodra een aangebrachte opdrachtgever zijn eerste
        factuur betaalt, verschijnt hij hier.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {beloningen.map((b) => (
        <Kaart key={b.id} beloning={b} />
      ))}
    </div>
  );
}
