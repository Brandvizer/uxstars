"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import FoundingBalk from "@/components/account/FoundingBalk";
import { FOUNDING_FASE } from "@/lib/founding-fase";
import { AANBRENGEN } from "@/lib/aanbrengen";
import Input, { Textarea } from "@/components/ui/Input";
import { werkProfielBij, uitloggenStar } from "@/app/account/actions";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import NodigUit from "@/components/account/NodigUit";
import BrengOpdrachtgever, {
  type Aanbeveling,
} from "@/components/account/BrengOpdrachtgever";
import type { Database } from "@/lib/database.types";

type Star = Database["public"]["Tables"]["stars"]["Row"];
type TabId = "profiel" | "reacties" | "stelsel" | "opdrachtgever";

export type MijnReactie = {
  id: string;
  missie_titel: string;
  missie_slug: string;
  missie_status: string;
  status: string;
  created_at: string;
};

export type Stelsel = {
  gevouched_door: string | null;
  directe: {
    id: string;
    naam: string;
    specialisme: string;
    beschikbaar: boolean;
    foto_url: string | null;
  }[];
  aantal_afstammelingen: number;
};

const specialismen = [
  "UX Design",
  "Product Design",
  "UX Research",
  "Service Design",
  "UX Writing",
  "Interaction Design",
  "Design Systems",
  "UX Strategy",
  "Content Design",
  "UI / Visual Design",
  "Design Ops",
  "Conversation Design",
];
const seniorityNiveaus = ["Junior", "Medior", "Senior", "Lead", "Principal"];

const veld =
  "w-full rounded-xl border border-lijn bg-achtergrond px-4 py-3 text-base text-tekst focus:border-accent focus:outline-none";

const REACTIE_STATUS: Record<string, { label: string; klasse: string }> = {
  nieuw: { label: "Verstuurd", klasse: "border-lijn text-tekst-secundair" },
  bekeken: { label: "Bekeken", klasse: "border-accent/50 text-accent" },
  uitgenodigd: {
    label: "Uitgenodigd",
    klasse: "border-succes/50 bg-succes/5 text-succes",
  },
  afgewezen: {
    label: "Niet geselecteerd",
    klasse: "border-lijn text-tekst-secundair",
  },
};

export default function AccountForm({
  profiel,
  uitnodiging,
  stelsel,
  aanbevelingen,
  reacties,
  email,
  userId,
  aanbrengCode,
}: {
  profiel: Star;
  uitnodiging: { token: string; code?: string | null; status: string } | null;
  stelsel: Stelsel | null;
  aanbevelingen: Aanbeveling[];
  reacties: MijnReactie[];
  email: string | undefined;
  userId: string;
  aanbrengCode: string | null;
}) {
  const [tab, setTab] = useState<TabId>("profiel");
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [beschikbaar, setBeschikbaar] = useState(profiel.beschikbaar);
  const [fotoUrl, setFotoUrl] = useState(profiel.foto_url);
  const [toestemming, setToestemming] = useState(profiel.foto_toestemming);
  const [uploadt, setUploadt] = useState(false);
  const fotoInput = useRef<HTMLInputElement>(null);

  const uploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadt(true);
    const supabase = getSupabaseBrowser();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const pad = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("profielfotos")
      .upload(pad, file, { upsert: true, cacheControl: "3600" });
    if (!error) {
      const { data } = supabase.storage.from("profielfotos").getPublicUrl(pad);
      setFotoUrl(`${data.publicUrl}?v=${Date.now()}`);
    }
    setUploadt(false);
  };

  const opslaan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBezig(true);
    setOpgeslagen(false);
    const f = new FormData(e.currentTarget);
    const resultaat = await werkProfielBij({
      naam: f.get("naam"),
      specialisme: f.get("specialisme"),
      seniority: f.get("seniority"),
      bio: f.get("bio"),
      tarief_uur: f.get("tarief_uur"),
      portfolio_url: f.get("portfolio_url"),
      linkedin_url: f.get("linkedin_url"),
      beschikbaar,
      foto_url: fotoUrl ?? "",
      foto_toestemming: toestemming,
    });
    setBezig(false);
    setOpgeslagen(resultaat.ok);
  };

  const inviteUrl =
    uitnodiging?.token && typeof window !== "undefined"
      ? `${window.location.origin}/uitnodiging/${uitnodiging.token}`
      : null;

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: "profiel", label: "Profiel" },
    { id: "reacties", label: "Reacties", badge: reacties.length },
    {
      id: "stelsel",
      label: "Jouw stelsel",
      badge: stelsel?.aantal_afstammelingen,
    },
    {
      id: "opdrachtgever",
      label: `Verdien ${AANBRENGEN.bedragTekst}`,
      badge: aanbevelingen.length,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="kop-2">Hallo {profiel.naam.split(" ")[0]}</h1>
          <p className="mt-1 text-tekst-secundair">{email}</p>
        </div>
        <form action={uitloggenStar}>
          <button
            type="submit"
            className="text-sm text-tekst-secundair transition-colors duration-200 hover:text-tekst"
          >
            Uitloggen
          </button>
        </form>
      </div>

      {FOUNDING_FASE && (
        <FoundingBalk
          naarTab={setTab}
          stappen={[
            {
              tab: "profiel",
              label: "Maak je profiel compleet",
              hint: [
                !profiel.tarief_uur && "uurtarief",
                !profiel.foto_url && "profielfoto",
                !profiel.bio && "korte bio",
              ]
                .filter(Boolean)
                .join(", ") || undefined,
              klaar: Boolean(profiel.tarief_uur && profiel.foto_url && profiel.bio),
            },
            {
              tab: "stelsel",
              label: "Geef je vouch weg",
              hint: "één designer die het verdient",
              klaar: Boolean(uitnodiging && uitnodiging.status !== "open"),
            },
            {
              tab: "opdrachtgever",
              label: "Breng een opdrachtgever binnen",
              hint: "ken je iemand die een ster zoekt?",
              klaar: aanbevelingen.length > 0,
            },
          ]}
        />
      )}

      {/* Tabs */}
      <nav className="mt-8 flex gap-1 overflow-x-auto border-b border-lijn [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => {
          const a = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px flex flex-1 items-center justify-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors duration-200 sm:flex-none sm:justify-start sm:px-4 ${
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

      {/* Profiel */}
      {tab === "profiel" && (
        <div className="mt-8 rounded-2xl border border-lijn bg-paneel p-6 sm:p-8">
          <h2 className="kop-3">Je profiel</h2>

          {/* Profielfoto */}
          <div className="mt-6 flex items-center gap-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-lijn bg-achtergrond">
              {fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fotoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl text-tekst-secundair">
                  {profiel.naam.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <input
                ref={fotoInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={uploadFoto}
              />
              <button
                type="button"
                onClick={() => fotoInput.current?.click()}
                disabled={uploadt}
                className="rounded-full border border-lijn bg-achtergrond px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-tekst-secundair disabled:opacity-50"
              >
                {uploadt
                  ? "Uploaden…"
                  : fotoUrl
                    ? "Foto vervangen"
                    : "Foto uploaden"}
              </button>
              <p className="mt-2 text-xs text-tekst-secundair">
                PNG, JPG of WEBP, max 3 MB.
              </p>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-lijn bg-achtergrond p-4">
            <input
              type="checkbox"
              checked={toestemming}
              onChange={(e) => setToestemming(e.target.checked)}
              className="mt-1 h-4 w-4 accent-accent"
            />
            <span className="text-sm text-tekst-secundair">
              UXSTARS mag mijn foto ook elders op de site tonen, bijvoorbeeld
              als ster in het stelsel.
            </span>
          </label>

          {/* Beschikbaarheid — de gloed in het stelsel */}
          <button
            type="button"
            onClick={() => setBeschikbaar((b) => !b)}
            className={`mt-8 flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-colors duration-200 ${
              beschikbaar
                ? "border-succes/50 bg-succes/5"
                : "border-lijn bg-achtergrond"
            }`}
          >
            <span>
              <span className="font-semibold">
                {beschikbaar ? "Beschikbaar voor missies" : "Niet beschikbaar"}
              </span>
              <span className="mt-1 block text-sm text-tekst-secundair">
                Beschikbare sterren gloeien in het stelsel en vinden missies.
              </span>
            </span>
            <span
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                beschikbaar ? "bg-succes" : "bg-lijn"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                  beschikbaar ? "left-6" : "left-1"
                }`}
              />
            </span>
          </button>

          {/* Profielformulier */}
          <form onSubmit={opslaan} className="mt-6 space-y-5">
            <Input
              label="Naam"
              icoon="persoon"
              placeholder="Voor- en achternaam"
              name="naam"
              defaultValue={profiel.naam}
              required
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-base font-semibold">
                  Specialisme
                </label>
                <select
                  name="specialisme"
                  defaultValue={profiel.specialisme}
                  className={veld}
                >
                  {specialismen.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-base font-semibold">
                  Seniority
                </label>
                <select
                  name="seniority"
                  defaultValue={profiel.seniority}
                  className={veld}
                >
                  {seniorityNiveaus.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <Textarea
              label="Korte bio"
              name="bio"
              defaultValue={profiel.bio ?? ""}
              placeholder="Waar ben je goed in, wat voor werk zoek je?"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Uurtarief (€, privé)"
                name="tarief_uur"
                type="number"
                defaultValue={profiel.tarief_uur ?? ""}
                placeholder="95"
              />
              <Input
                label="Portfolio-link"
                name="portfolio_url"
                type="url"
                defaultValue={profiel.portfolio_url ?? ""}
                placeholder="https://jouwportfolio.nl"
              />
            </div>
            <Input
              label="LinkedIn"
              name="linkedin_url"
              type="url"
              defaultValue={profiel.linkedin_url ?? ""}
              placeholder="https://linkedin.com/in/…"
            />

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={bezig}>
                {bezig ? "Opslaan…" : "Profiel opslaan"}
              </Button>
              {opgeslagen && (
                <span className="text-sm text-succes">Opgeslagen ✓</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Reacties — missies waarop je reageerde */}
      {tab === "reacties" && (
        <div className="mt-8">
          <h2 className="kop-3">Jouw reacties</h2>
          <p className="mt-2 text-sm text-tekst-secundair">
            Missies waarop je hebt gereageerd, en waar ze staan.
          </p>
          {reacties.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-lijn bg-paneel px-6 py-12 text-center">
              <p className="text-tekst-secundair">
                Je hebt nog nergens op gereageerd.
              </p>
              <div className="mt-4">
                <Button href="/missies" variant="secundair">
                  Bekijk open missies
                </Button>
              </div>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {reacties.map((r) => {
                const st = REACTIE_STATUS[r.status] ?? REACTIE_STATUS.nieuw;
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lijn bg-paneel p-5"
                  >
                    <div className="min-w-0">
                      <a
                        href={`/missies/${r.missie_slug}`}
                        className="font-semibold transition-colors duration-200 hover:text-accent-actief"
                      >
                        {r.missie_titel}
                      </a>
                      <p className="mt-1 text-sm text-tekst-secundair">
                        Gereageerd op{" "}
                        {new Date(r.created_at).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {r.missie_status === "gevuld" ? " · missie gevuld" : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${st.klasse}`}
                    >
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Jouw stelsel — vouch + tak */}
      {tab === "stelsel" && (
        <>
          {inviteUrl && uitnodiging?.status === "open" ? (
            /* De vouch als gouden ticket: dit is iets waardevols dat je weggeeft */
            <div className="relative mt-8 overflow-hidden rounded-2xl border border-accent/50 bg-paneel p-6 shadow-[0_0_60px_rgba(245,185,65,0.12)] sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 55% 80% at 100% 0%, rgba(245,185,65,0.16), transparent 70%)",
                }}
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 fill-accent/[0.07]"
              >
                <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
              </svg>

              <div className="relative">
                <p className="label flex items-center gap-2 text-accent">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 fill-accent"
                    aria-hidden="true"
                  >
                    <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
                  </svg>
                  Jouw vouch · 1 beschikbaar
                </p>
                <h2 className="mt-3 kop-2">Je hebt één ster weg te geven</h2>
                <p className="mt-3 max-w-xl text-tekst-secundair">
                  Kies met zorg: één designer uit jouw netwerk krijgt hiermee
                  een plek in het stelsel. Zij krassen de vouch open, wij
                  beoordelen kort, en vanaf dan stamt hun ster van jou af.
                </p>
                {uitnodiging.code && (
                  <p className="mt-5 inline-flex items-center gap-3 rounded-full border border-accent/40 bg-achtergrond/70 px-4 py-2 font-mono text-sm tracking-[0.2em] text-accent">
                    {uitnodiging.code}
                  </p>
                )}
                <div className="mt-6">
                  <NodigUit inviteUrl={inviteUrl} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-lijn bg-paneel p-6 sm:p-8">
              <h2 className="kop-3">Jouw vouch is weggegeven</h2>
              <p className="mt-3 text-tekst-secundair">
                Mooi, het stelsel groeit. Hieronder zie je wie er via jou bij
                kwam.
              </p>
            </div>
          )}

          {/* Jouw tak van het stelsel */}
          {stelsel && (
            <div className="mt-8 rounded-2xl border border-lijn bg-paneel p-6 sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <h2 className="kop-3">Jouw tak van het stelsel</h2>
                <div className="text-right">
                  <div className="text-3xl font-bold leading-none text-accent">
                    {stelsel.aantal_afstammelingen}
                  </div>
                  <div className="mt-1 text-xs text-tekst-secundair">
                    {stelsel.aantal_afstammelingen === 1
                      ? "ster stamt"
                      : "sterren stammen"}{" "}
                    van jou af
                  </div>
                </div>
              </div>

              {stelsel.gevouched_door && (
                <p className="mt-3 text-tekst-secundair">
                  Gevouched door{" "}
                  <span className="text-tekst">{stelsel.gevouched_door}</span>
                </p>
              )}

              <div className="mt-5">
                {stelsel.directe.length === 0 ? (
                  <p className="text-tekst-secundair">
                    Je hebt nog niemand gevouched.{" "}
                    {inviteUrl ? "Geef je vouch en zie je tak oplichten." : ""}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-tekst-secundair">Jij vouchte:</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {stelsel.directe.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 rounded-full border border-lijn bg-achtergrond py-1.5 pl-1.5 pr-4"
                        >
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-paneel">
                            {s.foto_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={s.foto_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm text-tekst-secundair">
                                {s.naam.charAt(0)}
                              </div>
                            )}
                            {s.beschikbaar && (
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-achtergrond bg-succes" />
                            )}
                          </div>
                          <span className="text-sm">{s.naam}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "opdrachtgever" && (
        <BrengOpdrachtgever aanbevelingen={aanbevelingen} aanbrengCode={aanbrengCode} />
      )}
    </div>
  );
}
