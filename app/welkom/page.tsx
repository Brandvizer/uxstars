"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { meldNieuweAanmelding } from "@/app/welkom/actions";
import { werkProfielBij } from "@/app/account/actions";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";

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
  const [geactiveerd, setGeactiveerd] = useState<string | null>(null);

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
    const naam = String(f.get("naam"));
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.rpc("gebruik_uitnodiging", {
      p_token: token,
      p_naam: naam,
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

    // Portfolio/LinkedIn/motivatie in het (nieuwe) profiel opslaan — nodig voor
    // de beoordeling en meteen bewaard in het account.
    await werkProfielBij({
      portfolio_url: String(f.get("portfolio_url") ?? ""),
      linkedin_url: String(f.get("linkedin_url") ?? ""),
      bio: String(f.get("bio") ?? ""),
    }).catch(() => {});

    localStorage.removeItem("uxstars_uitnodiging");
    // Meld de aanmelding aan het team voor beoordeling — fire-and-forget.
    void meldNieuweAanmelding(naam).catch(() => {});
    setGeactiveerd(naam);
  };

  if (geactiveerd) {
    return (
      <div className="relative mx-auto flex min-h-[82vh] max-w-lg flex-col items-center justify-center px-4 text-center sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
        />
        <svg
          viewBox="0 0 24 24"
          className="ster-ontvlam relative h-24 w-24 fill-accent"
          aria-hidden="true"
        >
          <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
        </svg>
        <h1
          className="rijs-in relative mt-10"
          style={{ animationDelay: "0.3s" }}
        >
          Je aanmelding is binnen
        </h1>
        <p
          className="rijs-in relative mt-4 text-lg text-tekst-secundair"
          style={{ animationDelay: "0.5s" }}
        >
          Bedankt, {geactiveerd.split(" ")[0]}. Ons team bekijkt je aanmelding
          kort. Een menselijke check hoort bij een gevoucht netwerk. Je krijgt
          zo snel mogelijk bericht per mail.
        </p>
        <div
          className="rijs-in relative mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-tekst-secundair"
          style={{ animationDelay: "0.6s" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-lijn bg-paneel/60 px-4 py-1.5">
            We beoordelen je aanmelding
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-lijn bg-paneel/60 px-4 py-1.5">
            Je hoort het per mail
          </span>
        </div>
        <div className="rijs-in relative mt-8" style={{ animationDelay: "0.75s" }}>
          <Button onClick={() => router.replace("/account")}>
            Bekijk je status
          </Button>
        </div>
      </div>
    );
  }

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
        <h1 className="kop-2">Geen uitnodiging gevonden</h1>
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
      <h1 className="kop-2">Maak je ster</h1>
      <p className="mt-3 text-tekst-secundair">
        Vul je gegevens in. Hiermee beoordeelt ons team je aanmelding. Je kunt
        alles later aanpassen in je profiel.
      </p>

      <form onSubmit={aanmaken} className="mt-8 space-y-5">
        <Input label="Naam" name="naam" placeholder="Voor- en achternaam" required />
        <div className="grid gap-5 sm:grid-cols-2">
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
        </div>
        <Input
          label="Portfolio-link"
          name="portfolio_url"
          type="url"
          placeholder="https://jouwportfolio.nl"
          required
        />
        <Input
          label="LinkedIn (optioneel)"
          name="linkedin_url"
          type="url"
          placeholder="https://linkedin.com/in/…"
        />
        <Textarea
          label="Waarom jij past bij UXSTARS"
          name="bio"
          placeholder="Vertel kort waar je goed in bent en wat voor werk je zoekt. Dit helpt ons je aanmelding te beoordelen."
          required
        />
        <Button type="submit" disabled={bezig} className="w-full">
          {bezig ? "Je ster gaat aan…" : "Word een ster"}
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
