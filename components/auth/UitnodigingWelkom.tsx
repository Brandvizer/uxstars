"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";
import Kraslaag from "@/components/ui/Kraslaag";
import VouchAanmelding from "@/components/auth/VouchAanmelding";

/** Rustige constellatie op de achtergrond — het stelsel achter je vouch. */
function NetwerkAchtergrond() {
  const sterren = [
    [12, 18], [28, 40], [45, 12], [62, 30], [80, 20], [88, 48],
    [70, 62], [52, 78], [34, 66], [18, 82], [8, 52], [95, 72],
  ];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
    >
      <g className="stroke-accent/20" strokeWidth="0.15">
        <path d="M12 18 L28 40 L45 12 L62 30 L80 20" fill="none" />
        <path d="M34 66 L52 78 L70 62 L88 48" fill="none" />
        <path d="M18 82 L34 66 M28 40 L34 66 M62 30 L70 62" fill="none" />
      </g>
      {sterren.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 0.7 : 0.4} className="fill-accent/50" />
      ))}
    </svg>
  );
}

export default function UitnodigingWelkom({
  token,
  geldig,
  uitnodiger,
  code,
  ingelogdAls,
}: {
  token: string;
  geldig: boolean;
  uitnodiger: string | null;
  code: string | null;
  ingelogdAls: string | null;
}) {
  const [fase, setFase] = useState<"kras" | "aanmelden">("kras");
  const [gevalideerd, setGevalideerd] = useState(false);
  const [verstuurd, setVerstuurd] = useState(false);
  const [uitloggen, setUitloggen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(`uxstars_kras_${token}`)) setFase("aanmelden");
    } catch {}
  }, [token]);

  const uitloggenEnHerlaad = async () => {
    setUitloggen(true);
    try {
      await getSupabaseBrowser().auth.signOut();
    } catch {}
    window.location.reload();
  };

  if (!geldig) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 text-center sm:px-6">
        <h1 className="!text-[clamp(1.5rem,3vw+1rem,2rem)]">Uitnodiging niet geldig</h1>
        <p className="mt-3 text-tekst-secundair">
          Deze vouch bestaat niet of is al gebruikt. Vraag degene die je
          uitnodigde om een nieuwe, of misschien is het stelsel al rond.
        </p>
      </div>
    );
  }

  if (ingelogdAls) {
    return (
      <div className="relative mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
        />
        <svg viewBox="0 0 24 24" className="relative h-14 w-14 fill-accent" aria-hidden="true">
          <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
        </svg>
        <p className="relative mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-accent">
          Je bent al ingelogd
        </p>
        <h1 className="relative mt-3 !text-[clamp(1.5rem,3vw+1rem,2.25rem)]">
          Deze vouch is voor iemand anders
        </h1>
        <p className="relative mt-4 text-tekst-secundair">
          Je bent ingelogd als <span className="text-tekst">{ingelogdAls}</span> en
          hebt al toegang tot UXSTARS. Wil je deze vouch met een ander e-mailadres
          claimen? Log dan eerst uit.
        </p>
        <div className="relative mt-8">
          <Button onClick={uitloggenEnHerlaad} disabled={uitloggen}>
            {uitloggen ? "Uitloggen…" : "Uitloggen en vouch claimen"}
          </Button>
        </div>
        <p className="relative mt-4 text-sm text-tekst-secundair">
          Of deel deze link met de persoon voor wie de vouch bedoeld is.
        </p>
      </div>
    );
  }

  if (verstuurd) {
    return (
      <div className="relative mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4 text-center sm:px-6">
        <NetwerkAchtergrond />
        <svg
          viewBox="0 0 24 24"
          className="ster-ontvlam relative h-20 w-20 fill-accent"
          aria-hidden="true"
        >
          <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
        </svg>
        <h1 className="rijs-in relative mt-8 !text-[clamp(1.75rem,3vw+1rem,2.75rem)]" style={{ animationDelay: "0.2s" }}>
          Je aanmelding is binnen ✦
        </h1>
        <p className="rijs-in relative mt-4 text-lg text-tekst-secundair" style={{ animationDelay: "0.4s" }}>
          Bedankt! Ons team bekijkt je aanmelding. Een menselijke check hoort bij
          een gevoucht netwerk. Bij goedkeuring krijg je een mail om je account af
          te ronden.
        </p>
      </div>
    );
  }

  const naOnthuld = () => {
    setGevalideerd(true);
    setTimeout(() => setFase("aanmelden"), 1200);
  };

  return (
    <div className="relative mx-auto flex min-h-[85vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <NetwerkAchtergrond />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <svg
        viewBox="0 0 24 24"
        className="ster-ontvlam relative h-16 w-16 fill-accent"
        aria-hidden="true"
      >
        <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
      </svg>

      {fase === "kras" ? (
        <>
          <p className="relative mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            Je hebt een vouch ontvangen
          </p>
          <h1 className="relative mt-4 !text-[clamp(1.75rem,3vw+1rem,2.75rem)]">
            Kras je plek vrij
          </h1>
          <p className="relative mt-4 text-lg text-tekst-secundair">
            {uitnodiger ? (
              <>
                <span className="text-tekst">{uitnodiger}</span> vouchte jou voor
                UXSTARS.
              </>
            ) : (
              <>Je bent gevouched voor UXSTARS.</>
            )}{" "}
            Kras de kaart hieronder open.
          </p>

          <div className="relative mt-8 w-full max-w-sm">
            <Kraslaag
              hint="Kras je vouch open ✦"
              onthoudSleutel={`uxstars_kras_${token}`}
              onOnthuld={naOnthuld}
            >
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tekst-secundair">
                  Je vouch-code
                </p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-succes">
                  {code ?? "STAR-••••"}
                </p>
                <p className="mt-1 text-sm font-semibold text-succes">✓ geldig</p>
              </div>
            </Kraslaag>
            {gevalideerd && (
              <p className="rijs-in mt-3 text-sm text-succes">
                Geldige vouch, we brengen je verder…
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="relative w-full">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            Je vouch is geldig ✦
          </p>
          <h1 className="mt-4 !text-[clamp(1.75rem,3vw+1rem,2.5rem)]">
            Meld je aan
          </h1>
          <p className="mx-auto mt-4 max-w-md text-tekst-secundair">
            Nog een paar stappen. Daarna beoordeelt ons team je aanmelding. Je
            hoeft nu nog geen account te maken.
          </p>
          <div className="mt-8 flex justify-center">
            <VouchAanmelding token={token} onKlaar={() => setVerstuurd(true)} />
          </div>
        </div>
      )}
    </div>
  );
}
