"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import { werkProfielBij, uitloggenStar } from "@/app/account/actions";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import BrengOpdrachtgever, {
  type Aanbeveling,
} from "@/components/account/BrengOpdrachtgever";
import type { Database } from "@/lib/database.types";

type Star = Database["public"]["Tables"]["stars"]["Row"];

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
  "UX Design", "Product Design", "UX Research", "Service Design", "UX Writing",
  "Interaction Design", "Design Systems", "UX Strategy", "Content Design",
  "UI / Visual Design", "Design Ops", "Conversation Design",
];
const seniorityNiveaus = ["Junior", "Medior", "Senior", "Lead", "Principal"];

const veld =
  "w-full rounded-xl border border-lijn bg-paneel px-4 py-3 text-base text-tekst focus:border-accent focus:outline-none";

export default function AccountForm({
  profiel,
  uitnodiging,
  stelsel,
  aanbevelingen,
  email,
  userId,
}: {
  profiel: Star;
  uitnodiging: { token: string; status: string } | null;
  stelsel: Stelsel | null;
  aanbevelingen: Aanbeveling[];
  email: string | undefined;
  userId: string;
}) {
  const [bezig, setBezig] = useState(false);
  const [opgeslagen, setOpgeslagen] = useState(false);
  const [gekopieerd, setGekopieerd] = useState(false);
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="!text-[clamp(1.75rem,3vw+1rem,2.5rem)]">
            Hallo {profiel.naam.split(" ")[0]}
          </h1>
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

      {/* Profielfoto */}
      <div className="mt-8 flex items-center gap-5">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-lijn bg-paneel">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
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
            className="rounded-full border border-lijn bg-paneel px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:border-tekst-secundair disabled:opacity-50"
          >
            {uploadt ? "Uploaden…" : fotoUrl ? "Foto vervangen" : "Foto uploaden"}
          </button>
          <p className="mt-2 text-xs text-tekst-secundair">
            PNG, JPG of WEBP — max 3 MB.
          </p>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-lijn bg-paneel p-4">
        <input
          type="checkbox"
          checked={toestemming}
          onChange={(e) => setToestemming(e.target.checked)}
          className="mt-1 h-4 w-4 accent-accent"
        />
        <span className="text-sm text-tekst-secundair">
          UXSTARS mag mijn foto ook elders op de site tonen — bijvoorbeeld als
          ster in het stelsel.
        </span>
      </label>

      {/* Beschikbaarheid — de gloed in het stelsel */}
      <button
        type="button"
        onClick={() => setBeschikbaar((b) => !b)}
        className={`mt-8 flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-colors duration-200 ${
          beschikbaar ? "border-succes/50 bg-succes/5" : "border-lijn bg-paneel"
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
        <Input label="Naam" name="naam" defaultValue={profiel.naam} required />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-base font-semibold">Specialisme</label>
            <select name="specialisme" defaultValue={profiel.specialisme} className={veld}>
              {specialismen.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-base font-semibold">Seniority</label>
            <select name="seniority" defaultValue={profiel.seniority} className={veld}>
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
            placeholder="https://"
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

      {/* Jouw vouch */}
      <div className="mt-12 rounded-2xl border border-accent/30 bg-paneel p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Jouw vouch</h2>
        {inviteUrl ? (
          <>
            <p className="mt-3 text-tekst-secundair">
              Alleen de beste designers krijgen toegang. Jij weet wie in jouw
              netwerk eruit springt — geef deze ene vouch aan hem of haar.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={inviteUrl}
                className={`${veld} font-mono text-sm`}
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="secundair"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteUrl);
                  setGekopieerd(true);
                  setTimeout(() => setGekopieerd(false), 2000);
                }}
              >
                {gekopieerd ? "Gekopieerd ✓" : "Kopieer"}
              </Button>
            </div>
            <p className="mt-3 text-sm text-tekst-secundair">
              Je kunt deze vouch éénmaal weggeven.
            </p>
          </>
        ) : (
          <p className="mt-3 text-tekst-secundair">
            Je hebt je vouch al weggegeven. Mooi — het stelsel groeit.
          </p>
        )}
      </div>

      {/* Jouw tak van het stelsel */}
      {stelsel && (
        <div className="mt-8 rounded-2xl border border-lijn bg-paneel p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold">Jouw tak van het stelsel</h2>
            <div className="text-right">
              <div className="text-3xl font-bold leading-none text-accent">
                {stelsel.aantal_afstammelingen}
              </div>
              <div className="mt-1 text-xs text-tekst-secundair">
                {stelsel.aantal_afstammelingen === 1 ? "ster stamt" : "sterren stammen"} van jou af
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
                {inviteUrl
                  ? "Geef je vouch en zie je tak oplichten."
                  : ""}
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

      <BrengOpdrachtgever aanbevelingen={aanbevelingen} />
    </div>
  );
}
