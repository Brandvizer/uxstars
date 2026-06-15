"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

type Staat = "laden" | "anoniem" | "geen-ster" | "kan-reageren" | "gereageerd";

export default function MissieReactie({ missieId }: { missieId?: string }) {
  const [staat, setStaat] = useState<Staat>("laden");
  const [motivatie, setMotivatie] = useState("");
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (!missieId) {
      setStaat("anoniem");
      return;
    }
    const supabase = getSupabaseBrowser();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStaat("anoniem");
        return;
      }
      const { data: profiel } = await supabase.rpc("mijn_profiel");
      if (!profiel || profiel.length === 0) {
        setStaat("geen-ster");
        return;
      }
      const { data: reactie } = await supabase.rpc("mijn_reactie", {
        p_missie_id: missieId,
      });
      setStaat(reactie ? "gereageerd" : "kan-reageren");
    })();
  }, [missieId]);

  const reageer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missieId) return;
    setBezig(true);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.rpc("reageer_op_missie", {
      p_missie_id: missieId,
      p_motivatie: motivatie,
    });
    setBezig(false);
    if (!error) setStaat("gereageerd");
  };

  if (staat === "laden") {
    return <p className="mt-2 text-tekst-secundair">Even laden…</p>;
  }

  if (staat === "gereageerd") {
    return (
      <p className="mt-3 flex items-center gap-2 text-succes">
        <span className="h-1.5 w-1.5 rounded-full bg-succes" />
        Je hebt op deze missie gereageerd. We laten het weten.
      </p>
    );
  }

  if (staat === "anoniem") {
    return (
      <>
        <p className="mt-2 text-tekst-secundair">
          Reageren op missies is voor sterren in het netwerk.
        </p>
        <div className="mt-6">
          <Button href="/account/login">Log in als ster</Button>
        </div>
      </>
    );
  }

  if (staat === "geen-ster") {
    return (
      <p className="mt-2 text-tekst-secundair">
        Je bent ingelogd, maar nog geen ster. UXSTARS is invite-only — je komt
        binnen via een vouch.{" "}
        <Link href="/account" className="text-accent hover:text-accent-actief">
          Naar je account
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={reageer} className="mt-4">
      <Textarea
        label="Waarom past deze missie bij jou?"
        name="motivatie"
        value={motivatie}
        onChange={(e) => setMotivatie(e.target.value)}
        placeholder="Vertel kort waarom jij de juiste ster bent."
      />
      <div className="mt-4">
        <Button type="submit" disabled={bezig}>
          {bezig ? "Versturen…" : "Reageer op deze missie"}
        </Button>
      </div>
    </form>
  );
}
