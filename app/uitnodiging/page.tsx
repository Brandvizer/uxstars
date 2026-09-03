"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";

export default function VouchInwisselen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "bezig" | "geldig" | "ongeldig">(
    "idle",
  );
  const [uitnodiger, setUitnodiger] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const controleer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus("bezig");
    const supabase = getSupabaseBrowser();
    const { data } = await supabase.rpc("uitnodiging_via_code", {
      p_code: code.trim(),
    });
    const r = data as {
      geldig: boolean;
      uitnodiger: string | null;
      token: string | null;
    } | null;
    if (r?.geldig && r.token) {
      setUitnodiger(r.uitnodiger);
      setToken(r.token);
      setStatus("geldig");
    } else {
      setStatus("ongeldig");
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <svg
        viewBox="0 0 24 24"
        className="relative h-14 w-14 fill-accent"
        aria-hidden="true"
      >
        <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
      </svg>

      <p className="relative mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-accent">
        Wissel je vouch in
      </p>

      {status === "geldig" ? (
        <>
          <h1 className="rijs-in relative mt-4 !text-[clamp(1.75rem,3vw+1rem,2.5rem)]">
            Je bent gevouched ✦
          </h1>
          <p className="rijs-in relative mt-4 text-lg text-tekst-secundair">
            {uitnodiger ? (
              <>
                <span className="text-tekst">{uitnodiger}</span> staat voor je in.
              </>
            ) : (
              <>Deze vouch is geldig.</>
            )}{" "}
            Je plek tussen de sterren staat klaar.
          </p>
          <div className="rijs-in relative mt-8">
            <Button onClick={() => router.push(`/uitnodiging/${token}`)}>
              Word een ster
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="relative mt-4 !text-[clamp(1.75rem,3vw+1rem,2.5rem)]">
            Heb je een vouch-code?
          </h1>
          <p className="relative mt-4 text-tekst-secundair">
            Vul de code in die je van een ster kreeg. Geen code? Dan kom je binnen
            via een persoonlijke vouch-link.
          </p>

          <form
            onSubmit={controleer}
            className="relative mt-8 w-full space-y-4 rounded-2xl border border-lijn bg-paneel p-6"
          >
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (status === "ongeldig") setStatus("idle");
              }}
              placeholder="STAR-XXXX"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-lijn bg-achtergrond px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.25em] text-accent placeholder:text-tekst-secundair/50 focus:border-accent focus:outline-none"
            />
            <Button
              type="submit"
              disabled={status === "bezig" || !code.trim()}
              className="w-full"
            >
              {status === "bezig" ? "Controleren…" : "Controleer code"}
            </Button>
            {status === "ongeldig" && (
              <p className="text-sm text-accent-actief" role="alert">
                Deze code bestaat niet of is al gebruikt. Check &apos;m even bij
                degene die je vouchte.
              </p>
            )}
          </form>
        </>
      )}
    </div>
  );
}
