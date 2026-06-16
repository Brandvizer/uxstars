"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  maakBedrijf,
  werkBedrijfBij,
  startMembershipTrial,
  startCheckout,
} from "@/app/bedrijf/actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { MEMBERSHIP, euro } from "@/lib/membership";

const VOORDELEN = [
  {
    titel: "Onbeperkt missies plaatsen",
    tekst: "Geen kosten per vacature — plaats zoveel opdrachten als je wilt.",
  },
  {
    titel: "Het gevouchte netwerk",
    tekst: "Alleen designers die door hun peers zijn aanbevolen. Geen ruis.",
  },
  {
    titel: "Direct contact met je designer",
    tekst: "Praat rechtstreeks, zonder tussenpersoon of recruiter.",
  },
  {
    titel: "Keuze per opdracht",
    tekst: "Direct of Via UXSTARS — zonder Wet-DBA-risico, zonder gedoe.",
  },
  {
    titel: "Persoonlijke matching",
    tekst: "We denken mee welke ster het beste bij je missie past.",
  },
];

export default function BedrijfWelkom() {
  const router = useRouter();
  const [klaar, setKlaar] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [stap, setStap] = useState(1);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(false);

  const [naam, setNaam] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadt, setUploadt] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);

  const [ritme, setRitme] = useState<"maand" | "jaar">("jaar");

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/bedrijf/login");
        return;
      }
      setUserId(data.user.id);
      // Terug van Stripe Checkout → toon de viering.
      if (new URLSearchParams(window.location.search).get("succes") === "1") {
        setStap(3);
      }
      setKlaar(true);
    });
  }, [router]);

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadt(true);
    const supabase = getSupabaseBrowser();
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const pad = `${userId}/logo.${ext}`;
    const { error } = await supabase.storage
      .from("profielfotos")
      .upload(pad, file, { upsert: true, cacheControl: "3600" });
    if (!error) {
      const { data } = supabase.storage.from("profielfotos").getPublicUrl(pad);
      setLogoUrl(`${data.publicUrl}?v=${Date.now()}`);
    }
    setUploadt(false);
  };

  const verstuurStap1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setBezig(true);
    setFout(false);
    const r = await maakBedrijf(naam);
    if (!r.ok) {
      setBezig(false);
      setFout(true);
      return;
    }
    await werkBedrijfBij({
      naam,
      contactpersoon: contact,
      website,
      logo_url: logoUrl ?? "",
    });
    setBezig(false);
    setStap(2);
  };

  const kiesPlan = async () => {
    setBezig(true);
    // Stripe Checkout proberen; geen Stripe geconfigureerd? Dan direct de trial.
    const checkout = await startCheckout(ritme);
    if (checkout.url) {
      window.location.href = checkout.url;
      return;
    }
    const tier =
      ritme === "jaar" ? MEMBERSHIP.jaar.tier : MEMBERSHIP.maand.tier;
    await startMembershipTrial(tier);
    setBezig(false);
    setStap(3);
  };

  if (!klaar) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <p className="text-tekst-secundair">Even geduld…</p>
      </div>
    );
  }

  const plan = ritme === "jaar" ? MEMBERSHIP.jaar : MEMBERSHIP.maand;

  return (
    <div className={`mx-auto px-4 py-16 sm:px-6 ${stap === 2 ? "max-w-4xl" : "max-w-xl"}`}>
      {stap < 3 && (
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                n <= stap ? "bg-accent" : "bg-lijn"
              }`}
            />
          ))}
        </div>
      )}

      {/* Stap 1 — gegevens + logo */}
      {stap === 1 && (
        <>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
            Stap 1 van 3
          </p>
          <h1 className="mt-3 !text-[clamp(1.75rem,3vw+1rem,2.5rem)]">
            Je bedrijfsgegevens
          </h1>
          <p className="mt-3 text-tekst-secundair">
            Vul je gegevens in — deze gebruiken we voor je missies.
          </p>

          <form
            onSubmit={verstuurStap1}
            className="mt-8 space-y-5 rounded-2xl border border-lijn bg-paneel p-6 sm:p-8"
          >
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-lijn bg-achtergrond">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-tekst-secundair">
                    Logo
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={uploadLogo}
                />
                <button
                  type="button"
                  onClick={() => logoInput.current?.click()}
                  disabled={uploadt}
                  className="rounded-full border border-lijn bg-achtergrond px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-tekst-secundair disabled:opacity-50"
                >
                  {uploadt ? "Uploaden…" : logoUrl ? "Logo vervangen" : "Logo uploaden"}
                </button>
                <p className="mt-2 text-xs text-tekst-secundair">Optioneel.</p>
              </div>
            </div>

            <Input
              label="Bedrijfsnaam"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              required
            />
            <Input
              label="Contactpersoon"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Voor- en achternaam"
            />
            <Input
              label="Website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
            <Button type="submit" disabled={bezig} className="w-full">
              {bezig ? "Bezig…" : "Volgende →"}
            </Button>
            {fout && (
              <p className="text-sm text-accent-actief" role="alert">
                Er ging iets mis. Probeer het opnieuw.
              </p>
            )}
          </form>
        </>
      )}

      {/* Stap 2 — membership */}
      {stap === 2 && (
        <div className="grid gap-10 lg:grid-cols-5 lg:items-start">
          {/* Links — waarde */}
          <div className="lg:col-span-3">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
              Stap 2 van 3
            </p>
            <h1 className="mt-3 !text-[clamp(1.75rem,3vw+1rem,2.5rem)]">
              Kies je membership
            </h1>
            <p className="mt-3 text-tekst-secundair">
              Eén lidmaatschap, alles inbegrepen. Start met{" "}
              <span className="text-tekst">{MEMBERSHIP.trialDagen} dagen gratis</span> —
              je betaalt pas daarna en je kunt altijd opzeggen.
            </p>

            <ul className="mt-8 space-y-5">
              {VOORDELEN.map((v) => (
                <li key={v.titel} className="flex gap-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 fill-current"
                      aria-hidden="true"
                    >
                      <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold">{v.titel}</p>
                    <p className="text-sm text-tekst-secundair">{v.tekst}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Rechts — keuze + prijs */}
          <div className="lg:col-span-2 lg:sticky lg:top-28">
            <div className="rounded-3xl border border-accent/40 bg-paneel p-6 shadow-[0_0_60px_rgba(245,185,65,0.06)]">
              <div className="inline-flex rounded-full border border-lijn p-1">
                {(["maand", "jaar"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRitme(r)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
                      ritme === r
                        ? "bg-accent text-achtergrond"
                        : "text-tekst-secundair hover:text-tekst"
                    }`}
                  >
                    {r === "maand" ? "Maandelijks" : "Jaarlijks"}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.15em] text-accent">
                {MEMBERSHIP.naam}
              </p>
              <p className="mt-2">
                <span className="text-4xl font-bold">{euro(plan.prijs)}</span>{" "}
                <span className="text-tekst-secundair">{plan.periode}</span>
              </p>
              {ritme === "jaar" && (
                <p className="mt-1 text-sm text-succes">
                  ≈ 2 maanden gratis t.o.v. maandelijks
                </p>
              )}

              <Button onClick={kiesPlan} disabled={bezig} className="mt-6 w-full">
                {bezig ? "Bezig…" : `Start ${MEMBERSHIP.trialDagen} dagen gratis`}
              </Button>
              <p className="mt-3 text-center text-xs text-tekst-secundair">
                Geen verplichtingen tijdens de proefperiode.
              </p>

              <div className="mt-6 space-y-2 border-t border-lijn pt-5 text-sm text-tekst-secundair">
                <p className="flex items-center gap-2">
                  <span className="text-succes">✓</span> {MEMBERSHIP.trialDagen} dagen
                  gratis proberen
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-succes">✓</span> Maandelijks opzegbaar
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-succes">✓</span> Geen setup-kosten
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stap 3 — klaar */}
      {stap === 3 && (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <svg
            viewBox="0 0 24 24"
            className="ster-ontvlam h-20 w-20 fill-accent"
            aria-hidden="true"
          >
            <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
          </svg>
          <h1 className="rijs-in mt-8 !text-[clamp(1.75rem,3vw+1rem,2.5rem)]" style={{ animationDelay: "0.2s" }}>
            Account aangemaakt
          </h1>
          <p className="rijs-in mt-3 text-tekst-secundair" style={{ animationDelay: "0.4s" }}>
            Je proefperiode loopt — je kunt nu je eerste missie plaatsen.
          </p>
          <div className="rijs-in mt-8" style={{ animationDelay: "0.6s" }}>
            <Button onClick={() => router.replace("/bedrijf")}>
              Naar je portaal ✦
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
