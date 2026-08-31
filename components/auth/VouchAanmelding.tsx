"use client";

import { useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";

const SPECIALISMEN = [
  "UX Design", "Product Design", "UX Research", "Service Design", "UX Writing",
  "Interaction Design", "Design Systems", "UX Strategy", "Content Design",
  "UI / Visual Design", "Design Ops", "Conversation Design",
];
const SENIORITY = ["Junior", "Medior", "Senior", "Lead", "Principal"];

const veld =
  "w-full rounded-xl border border-lijn bg-achtergrond px-4 py-3 text-base text-tekst focus:border-accent focus:outline-none";
const label = "mb-2 block text-base font-semibold";

type Upload = { url: string | null; naam: string | null; bezig: boolean };

export default function VouchAanmelding({
  token,
  onKlaar,
}: {
  token: string;
  onKlaar: () => void;
}) {
  const [stap, setStap] = useState(0);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const [rol, setRol] = useState("UX Design");
  const [seniority, setSeniority] = useState("Senior");
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [motivatie, setMotivatie] = useState("");
  const [portfolio, setPortfolio] = useState<Upload>({ url: null, naam: null, bezig: false });
  const [cv, setCv] = useState<Upload>({ url: null, naam: null, bezig: false });

  const portfolioInput = useRef<HTMLInputElement>(null);
  const cvInput = useRef<HTMLInputElement>(null);

  const upload = async (
    file: File,
    zet: (u: Upload) => void,
  ) => {
    zet({ url: null, naam: file.name, bezig: true });
    const supabase = getSupabaseBrowser();
    const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
    const pad = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("aanmeldingen")
      .upload(pad, file, { cacheControl: "3600", upsert: false });
    if (error) {
      zet({ url: null, naam: null, bezig: false });
      setFout("Uploaden lukte niet. Probeer een ander bestand.");
      return;
    }
    const { data } = supabase.storage.from("aanmeldingen").getPublicUrl(pad);
    zet({ url: data.publicUrl, naam: file.name, bezig: false });
  };

  const stapGeldig = (): boolean => {
    if (stap === 1) return naam.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
    if (stap === 2) return Boolean(portfolioUrl.trim() || portfolio.url);
    if (stap === 3) return motivatie.trim().length > 10;
    return true;
  };

  const volgende = () => {
    setFout(null);
    if (!stapGeldig()) {
      setFout(
        stap === 1
          ? "Vul je naam en een geldig e-mailadres in."
          : stap === 2
            ? "Geef minstens een portfolio-link of een bestand."
            : "Vertel iets meer in je motivatie.",
      );
      return;
    }
    setStap((s) => s + 1);
  };

  const verstuur = async () => {
    if (!stapGeldig()) {
      setFout("Vertel iets meer in je motivatie.");
      return;
    }
    setBezig(true);
    setFout(null);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.rpc("dien_aanmelding_in", {
      payload: {
        token,
        naam: naam.trim(),
        email: email.trim(),
        rol,
        seniority,
        portfolio_url: portfolioUrl.trim(),
        portfolio_bestand: portfolio.url ?? "",
        cv_bestand: cv.url ?? "",
        motivatie: motivatie.trim(),
      },
    });
    setBezig(false);
    if (error) {
      setFout("Er ging iets mis bij het versturen. Probeer het opnieuw.");
      return;
    }
    onKlaar();
  };

  const totaal = 4;

  return (
    <div className="w-full max-w-md text-left">
      {/* Voortgang */}
      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: totaal }).map((_, n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              n <= stap ? "bg-accent" : "bg-lijn"
            }`}
          />
        ))}
      </div>
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-tekst-secundair">
        Stap {stap + 1} van {totaal}
      </p>

      <div className="rounded-2xl border border-lijn bg-paneel p-6 sm:p-8">
        {stap === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Wat doe je?</h2>
            <div>
              <label className={label}>Specialisme</label>
              <select className={veld} value={rol} onChange={(e) => setRol(e.target.value)}>
                {SPECIALISMEN.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Niveau</label>
              <select
                className={veld}
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
              >
                {SENIORITY.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {stap === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Wie ben je?</h2>
            <Input
              label="Naam"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Voor- en achternaam"
              required
            />
            <Input
              label="E-mailadres"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jij@voorbeeld.nl"
              required
            />
          </div>
        )}

        {stap === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Laat je werk zien</h2>
            <p className="text-sm text-tekst-secundair">
              Een link, een PDF, of allebei — wat jij het liefst deelt.
            </p>
            <Input
              label="Portfolio-link"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://jouwportfolio.nl"
            />

            <BestandsVeld
              label="Portfolio (PDF, optioneel)"
              upload={portfolio}
              inputRef={portfolioInput}
              accept="application/pdf"
              onKies={(f) => upload(f, setPortfolio)}
              onWis={() => setPortfolio({ url: null, naam: null, bezig: false })}
            />
            <BestandsVeld
              label="CV / ander werk (PDF, optioneel)"
              upload={cv}
              inputRef={cvInput}
              accept="application/pdf,image/*"
              onKies={(f) => upload(f, setCv)}
              onWis={() => setCv({ url: null, naam: null, bezig: false })}
            />
          </div>
        )}

        {stap === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Waarom jij?</h2>
            <Textarea
              label="Korte motivatie"
              value={motivatie}
              onChange={(e) => setMotivatie(e.target.value)}
              placeholder="Vertel kort waar je goed in bent en wat voor werk je zoekt — dit helpt ons je aanmelding te beoordelen."
            />
          </div>
        )}

        {fout && (
          <p className="mt-4 text-sm text-accent-actief" role="alert">
            {fout}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          {stap > 0 ? (
            <button
              type="button"
              onClick={() => {
                setFout(null);
                setStap((s) => s - 1);
              }}
              disabled={bezig}
              className="text-sm font-semibold text-tekst-secundair transition-colors duration-200 hover:text-tekst"
            >
              ← Vorige
            </button>
          ) : (
            <span />
          )}
          {stap < totaal - 1 ? (
            <Button type="button" onClick={volgende}>
              Volgende →
            </Button>
          ) : (
            <Button type="button" onClick={verstuur} disabled={bezig}>
              {bezig ? "Versturen…" : "Verstuur aanmelding ✦"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function BestandsVeld({
  label: veldLabel,
  upload,
  inputRef,
  accept,
  onKies,
  onWis,
}: {
  label: string;
  upload: Upload;
  inputRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  onKies: (f: File) => void;
  onWis: () => void;
}) {
  return (
    <div>
      <label className={label}>{veldLabel}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onKies(f);
        }}
      />
      {upload.url ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-succes/40 bg-achtergrond px-4 py-2.5 text-sm">
          <span className="truncate text-succes">✓ {upload.naam}</span>
          <button
            type="button"
            onClick={onWis}
            className="shrink-0 text-tekst-secundair hover:text-tekst"
          >
            Verwijderen
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.bezig}
          className="w-full rounded-xl border border-dashed border-lijn bg-achtergrond px-4 py-3 text-sm font-semibold text-tekst-secundair transition-colors duration-200 hover:border-tekst-secundair disabled:opacity-50"
        >
          {upload.bezig ? "Uploaden…" : "Kies een bestand"}
        </button>
      )}
    </div>
  );
}
