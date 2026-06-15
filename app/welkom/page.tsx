"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const specialismen = [
  "UX Design", "Product Design", "UX Research", "Service Design", "UX Writing",
  "Interaction Design", "Design Systems", "UX Strategy", "Content Design",
  "UI / Visual Design", "Design Ops", "Conversation Design",
];
const seniorityNiveaus = ["Junior", "Medior", "Senior", "Lead", "Principal"];
const veld =
  "w-full rounded-xl border border-lijn bg-paneel px-4 py-3 text-base text-tekst focus:border-accent focus:outline-none";

export default function Welkom() {
  const router = useRouter();
  const [klaar, setKlaar] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/account/login");
        return;
      }
      setToken(localStorage.getItem("uxstars_uitnodiging"));
      setKlaar(true);
    });
  }, [router]);

  const aanmaken = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setBezig(true);
    setFout(null);
    const f = new FormData(e.currentTarget);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.rpc("gebruik_uitnodiging", {
      p_token: token,
      p_naam: String(f.get("naam")),
      p_specialisme: String(f.get("specialisme")),
      p_seniority: String(f.get("seniority")),
    });
    if (error) {
      // Al lid? Dan gewoon door naar het profiel.
      if (error.message.includes("al een ster")) {
        localStorage.removeItem("uxstars_uitnodiging");
        router.replace("/account");
        return;
      }
      setBezig(false);
      setFout(error.message);
      return;
    }
    localStorage.removeItem("uxstars_uitnodiging");
    router.replace("/account");
  };

  if (!klaar) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <p className="text-tekst-secundair">Even geduld…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 text-center sm:px-6">
        <h1 className="!text-[clamp(1.5rem,3vw+1rem,2rem)]">Geen uitnodiging gevonden</h1>
        <p className="mt-3 text-tekst-secundair">
          Open de uitnodigingslink opnieuw in deze browser om je profiel aan te
          maken.
        </p>
        <div className="mt-6">
          <Button href="/account">Naar mijn profiel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="!text-[clamp(1.75rem,3vw+1rem,2.5rem)]">Maak je ster</h1>
      <p className="mt-3 text-tekst-secundair">
        Nog even je basis invullen — de rest beheer je daarna in je profiel.
      </p>

      <form onSubmit={aanmaken} className="mt-8 space-y-5">
        <Input label="Naam" name="naam" placeholder="Voor- en achternaam" required />
        <div>
          <label className="mb-2 block text-base font-semibold">Specialisme</label>
          <select name="specialisme" className={veld} defaultValue="UX Design">
            {specialismen.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-base font-semibold">Seniority</label>
          <select name="seniority" className={veld} defaultValue="Senior">
            {seniorityNiveaus.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={bezig} className="w-full">
          {bezig ? "Je ster gaat aan…" : "Word een ster ✦"}
        </Button>
        {fout && (
          <p className="text-sm text-accent-actief" role="alert">
            {fout}
          </p>
        )}
      </form>
    </div>
  );
}
