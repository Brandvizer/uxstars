"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Kras-vouch: een gouden folie over je unieke vouch-code die je met je muis of
 * vinger wegkrast. Bij ~55% onthult 'ie automatisch. De onthulling wordt per
 * code onthouden zodat je niet elke keer opnieuw hoeft te krassen.
 */
export default function KrasVouch({
  code,
  inviteUrl,
}: {
  code: string;
  inviteUrl: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tekenen = useRef(false);
  const meetTeller = useRef(0);
  const [onthuld, setOnthuld] = useState(false);
  const [codeGekopieerd, setCodeGekopieerd] = useState(false);
  const [linkGekopieerd, setLinkGekopieerd] = useState(false);

  const bewaarSleutel = `uxstars_vouch_onthuld_${code}`;

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(bewaarSleutel)) {
      setOnthuld(true);
      return;
    }
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = wrap.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#f5b941");
    grad.addColorStop(1, "#b9791a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(10,14,26,0.72)";
    ctx.font =
      "600 14px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Kras om je vouch te onthullen ✦", width / 2, height / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onthul = () => {
    setOnthuld(true);
    try {
      localStorage.setItem(bewaarSleutel, "1");
    } catch {}
  };

  const puntUit = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const meet = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let leeg = 0;
    let totaal = 0;
    for (let i = 3; i < data.length; i += 4 * 40) {
      totaal++;
      if (data[i] === 0) leeg++;
    }
    if (totaal > 0 && leeg / totaal > 0.55) onthul();
  };

  const kras = (e: React.PointerEvent) => {
    if (!tekenen.current || onthuld) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = puntUit(e);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    meetTeller.current = (meetTeller.current + 1) % 6;
    if (meetTeller.current === 0) meet();
  };

  const kopieer = async (waarde: string, zet: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(waarde);
      zet(true);
      setTimeout(() => zet(false), 2000);
    } catch {}
  };

  return (
    <div>
      <div
        ref={wrapRef}
        className="relative h-36 select-none overflow-hidden rounded-2xl border border-accent/40 bg-achtergrond"
      >
        {/* Onthulde inhoud (ligt eronder) */}
        <div
          className={`flex h-full flex-col items-center justify-center gap-1 transition-transform duration-500 ${
            onthuld ? "scale-100" : "scale-95"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tekst-secundair">
            Jouw vouch-code
          </p>
          <p className="font-mono text-3xl font-bold tracking-[0.25em] text-accent">
            {code}
          </p>
        </div>

        {/* Kras-folie */}
        {!onthuld && (
          <canvas
            ref={canvasRef}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              tekenen.current = true;
              kras(e);
            }}
            onPointerMove={kras}
            onPointerUp={() => {
              tekenen.current = false;
              meet();
            }}
            onPointerLeave={() => (tekenen.current = false)}
            className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
          />
        )}
      </div>

      {/* Acties — pas nadat je gekrast hebt */}
      {onthuld ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => kopieer(code, setCodeGekopieerd)}
              className="flex-1 rounded-full border border-lijn bg-achtergrond px-4 py-2.5 text-sm font-semibold transition-colors duration-200 hover:border-tekst-secundair"
            >
              {codeGekopieerd ? "Code gekopieerd ✓" : "Kopieer code"}
            </button>
            {inviteUrl && (
              <button
                type="button"
                onClick={() => kopieer(inviteUrl, setLinkGekopieerd)}
                className="flex-1 rounded-full border border-lijn bg-achtergrond px-4 py-2.5 text-sm font-semibold transition-colors duration-200 hover:border-tekst-secundair"
              >
                {linkGekopieerd ? "Link gekopieerd ✓" : "Kopieer link"}
              </button>
            )}
          </div>
          <p className="text-sm text-tekst-secundair">
            Geef de code of de link aan één designer. Zij wisselen &apos;m in op{" "}
            <span className="text-tekst">uxstars.nl/uitnodiging</span>. Je kunt je
            vouch éénmaal weggeven.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-tekst-secundair">
          Sleep met je muis over het gouden vlak om je code vrij te krassen.
        </p>
      )}
    </div>
  );
}
