"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { maakBedrijf } from "@/app/bedrijf/actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function BedrijfWelkom() {
  const router = useRouter();
  const [klaar, setKlaar] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/bedrijf/login");
        return;
      }
      setKlaar(true);
    });
  }, [router]);

  const aanmaken = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBezig(true);
    setFout(false);
    const f = new FormData(e.currentTarget);
    const r = await maakBedrijf(String(f.get("naam") ?? ""));
    if (r.ok) {
      router.replace("/bedrijf");
    } else {
      setBezig(false);
      setFout(true);
    }
  };

  if (!klaar) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <p className="text-tekst-secundair">Even geduld…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
        Welkom bij UXSTARS
      </p>
      <h1 className="mt-4 !text-[clamp(1.75rem,3vw+1rem,2.5rem)]">
        Maak je bedrijfsaccount
      </h1>
      <p className="mt-3 text-tekst-secundair">
        Nog even de naam van je organisatie — de rest beheer je daarna in je
        bedrijfsportaal.
      </p>

      <form onSubmit={aanmaken} className="mt-8 space-y-5">
        <Input label="Bedrijfsnaam" name="naam" placeholder="Acme Studio" required />
        <Button type="submit" disabled={bezig} className="w-full">
          {bezig ? "Account aanmaken…" : "Account aanmaken"}
        </Button>
        {fout && (
          <p className="text-sm text-accent-actief" role="alert">
            Er ging iets mis. Probeer het opnieuw.
          </p>
        )}
      </form>
    </div>
  );
}
