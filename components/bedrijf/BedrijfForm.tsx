"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import MissieKaart from "@/components/bedrijf/MissieKaart";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { werkBedrijfBij, uitloggenBedrijf, startPortal } from "@/app/bedrijf/actions";
import type { Bedrijf, MijnMissie } from "@/lib/bedrijf-data";

const STATUS: Record<string, { tekst: string; klasse: string }> = {
  actief: {
    tekst: "Actief membership",
    klasse: "border-succes/50 bg-succes/5 text-succes",
  },
  trial: {
    tekst: "Trial",
    klasse: "border-accent/50 bg-achtergrond text-accent",
  },
  verlopen: {
    tekst: "Membership verlopen",
    klasse: "border-lijn bg-achtergrond text-tekst-secundair",
  },
  geen: {
    tekst: "Geen membership",
    klasse: "border-lijn bg-achtergrond text-tekst-secundair",
  },
};

type Tab = "membership" | "missies" | "profiel";

/** On-brand lege-toestand voor de missies-tab. */
function LegeMissies({
  actief,
  naarMembership,
}: {
  actief: boolean;
  naarMembership: () => void;
}) {
  return (
    <div className="rounded-2xl border border-lijn bg-paneel px-6 py-16 text-center">
      <svg viewBox="0 0 64 64" className="mx-auto h-24 w-24 text-accent" aria-hidden="true">
        <circle cx="32" cy="30" r="20" className="animate-pulse fill-accent/5" />
        <circle cx="12" cy="14" r="1.4" className="fill-accent/40" />
        <circle cx="52" cy="17" r="1" className="fill-accent/30" />
        <circle cx="51" cy="46" r="1.6" className="fill-accent/40" />
        <circle cx="13" cy="47" r="1" className="fill-accent/30" />
        <path
          d="M32 13 l3.6 13 L49 30 l-13.4 3.6 L32 47 l-3.6-13.4 L15 30 l13.4-3.6 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeDasharray="3 3"
        />
      </svg>

      {actief ? (
        <>
          <h3 className="mt-6 text-lg font-semibold">
            Je stelsel wacht op zijn eerste missie
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-tekst-secundair">
            Plaats een missie en zie welke sterren oplichten. Binnen één werkdag
            heb je de eerste reacties.
          </p>
          <div className="mt-6">
            <Button href="/bedrijf/missie">Plaats je eerste missie ✦</Button>
          </div>
        </>
      ) : (
        <>
          <h3 className="mt-6 text-lg font-semibold">Nog geen missies</h3>
          <p className="mx-auto mt-2 max-w-sm text-tekst-secundair">
            Activeer je membership om missies te plaatsen en het gevouchte
            netwerk te bereiken.
          </p>
          <div className="mt-6">
            <Button variant="secundair" onClick={naarMembership}>
              Naar membership
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function BedrijfForm({
  bedrijf,
  email,
  actief,
  missies,
}: {
  bedrijf: Bedrijf;
  email: string | undefined;
  actief: boolean;
  missies: MijnMissie[];
}) {
  const [tab, setTab] = useState<Tab>("missies");
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [portaalBezig, setPortaalBezig] = useState(false);
  const [logoUrl, setLogoUrl] = useState(bedrijf.logo_url);
  const [logoBezig, setLogoBezig] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bedrijf.user_id) return;
    setLogoBezig(true);
    const supabase = getSupabaseBrowser();
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const pad = `${bedrijf.user_id}/logo.${ext}`;
    const { error } = await supabase.storage
      .from("profielfotos")
      .upload(pad, file, { upsert: true, cacheControl: "3600" });
    if (!error) {
      const { data } = supabase.storage.from("profielfotos").getPublicUrl(pad);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      setLogoUrl(url);
      await werkBedrijfBij({ logo_url: url });
    }
    setLogoBezig(false);
  };

  const schoneWebsite = bedrijf.website
    ? bedrijf.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;

  const naarPortaal = async () => {
    setPortaalBezig(true);
    const r = await startPortal();
    if (r.url) {
      window.location.href = r.url;
      return;
    }
    setPortaalBezig(false);
  };

  const opslaan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBezig(true);
    setOpgeslagen(false);
    const f = new FormData(e.currentTarget);
    const r = await werkBedrijfBij({
      naam: f.get("naam"),
      contactpersoon: f.get("contactpersoon"),
      telefoon: f.get("telefoon"),
      website: f.get("website"),
    });
    setBezig(false);
    setOpgeslagen(r.ok);
  };

  const status = STATUS[bedrijf.membership_status] ?? STATUS.geen;
  const tot = bedrijf.membership_tot
    ? new Date(bedrijf.membership_tot).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "membership", label: "Membership" },
    { id: "missies", label: "Jouw missies", badge: missies.length },
    { id: "profiel", label: "Bedrijfsprofiel" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="!text-[clamp(1.75rem,3vw+1rem,2.5rem)]">{bedrijf.naam}</h1>
          <p className="mt-1 text-tekst-secundair">{email}</p>
        </div>
        <form action={uitloggenBedrijf}>
          <button
            type="submit"
            className="text-sm text-tekst-secundair transition-colors duration-200 hover:text-tekst"
          >
            Uitloggen
          </button>
        </form>
      </div>

      {/* Tabs */}
      <nav className="mt-8 flex gap-1 overflow-x-auto border-b border-lijn">
        {tabs.map((t) => {
          const a = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                a
                  ? "border-accent text-tekst"
                  : "border-transparent text-tekst-secundair hover:text-tekst"
              }`}
            >
              {t.label}
              {typeof t.badge === "number" && t.badge > 0 && (
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent/15 px-1.5 py-0.5 text-xs font-semibold text-accent">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-8">
        {/* Membership */}
        {tab === "membership" && (
          <div className="rounded-2xl border border-lijn bg-paneel p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Membership</h2>
              <span
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${status.klasse}`}
              >
                {status.tekst}
              </span>
            </div>
            {actief ? (
              <p className="mt-3 text-tekst-secundair">
                Je kunt missies plaatsen in het stelsel.
                {bedrijf.membership_tier && ` Pakket: ${bedrijf.membership_tier}.`}
                {tot && ` Loopt tot ${tot}.`}
              </p>
            ) : (
              <p className="mt-3 text-tekst-secundair">
                Met een actief membership plaats je missies en bereik je het
                gevouchte netwerk. Mail{" "}
                <a
                  href="mailto:hallo@uxstars.nl?subject=Membership%20activeren"
                  className="font-semibold text-accent hover:text-accent-actief"
                >
                  hallo@uxstars.nl
                </a>{" "}
                om te activeren.
              </p>
            )}
            {bedrijf.stripe_customer_id && (
              <button
                type="button"
                onClick={naarPortaal}
                disabled={portaalBezig}
                className="mt-5 rounded-full border border-lijn bg-achtergrond px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-tekst-secundair disabled:opacity-50"
              >
                {portaalBezig ? "Even geduld…" : "Beheer abonnement →"}
              </button>
            )}
          </div>
        )}

        {/* Jouw missies */}
        {tab === "missies" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Jouw missies</h2>
              {actief && (
                <Button href="/bedrijf/missie" size="sm">
                  Plaats een missie
                </Button>
              )}
            </div>
            {missies.length === 0 ? (
              <div className="mt-5">
                <LegeMissies actief={actief} naarMembership={() => setTab("membership")} />
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm text-tekst-secundair">
                  Klik op een missie om de details aan te passen.
                </p>
                <ul className="mt-4 space-y-3">
                  {missies.map((m) => (
                    <MissieKaart key={m.id} missie={m} />
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Bedrijfsprofiel */}
        {tab === "profiel" && (
          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            <form
              onSubmit={opslaan}
              className="space-y-5 rounded-2xl border border-lijn bg-paneel p-6 sm:p-8 lg:col-span-2"
            >
              <h2 className="text-xl font-semibold">Bedrijfsprofiel</h2>
              <Input label="Bedrijfsnaam" name="naam" defaultValue={bedrijf.naam} required />
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Contactpersoon"
                  name="contactpersoon"
                  defaultValue={bedrijf.contactpersoon ?? ""}
                  placeholder="Voor- en achternaam"
                />
                <Input
                  label="Telefoon"
                  name="telefoon"
                  type="tel"
                  defaultValue={bedrijf.telefoon ?? ""}
                  placeholder="06…"
                />
              </div>
              <Input
                label="Website"
                name="website"
                type="url"
                defaultValue={bedrijf.website ?? ""}
                placeholder="https://"
              />
              <div className="flex items-center gap-4">
                <Button type="submit" disabled={bezig}>
                  {bezig ? "Opslaan…" : "Opslaan"}
                </Button>
                {opgeslagen && <span className="text-sm text-succes">Opgeslagen ✓</span>}
              </div>
            </form>

            {/* Visitekaartje — zo word je getoond */}
            <div className="rounded-2xl border border-lijn bg-paneel p-6 text-center">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-tekst-secundair">
                Je visitekaartje
              </h2>

              <div className="mx-auto mt-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-lijn bg-achtergrond">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-tekst-secundair">
                    {bedrijf.naam.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <p className="mt-4 font-semibold">{bedrijf.naam}</p>
              {schoneWebsite && (
                <a
                  href={bedrijf.website ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate text-sm text-accent transition-colors duration-200 hover:text-accent-actief"
                >
                  {schoneWebsite}
                </a>
              )}

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
                disabled={logoBezig}
                className="mt-6 w-full rounded-full border border-lijn bg-achtergrond px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-tekst-secundair disabled:opacity-50"
              >
                {logoBezig ? "Uploaden…" : logoUrl ? "Logo vervangen" : "Logo uploaden"}
              </button>
              <p className="mt-3 text-xs text-tekst-secundair">
                Een herkenbaar logo maakt je missies aantrekkelijker.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
