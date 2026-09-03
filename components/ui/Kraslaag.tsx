"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Herbruikbare kras-laag: een gouden folie over `children` die je met muis of
 * vinger wegkrast. Bij ~55% onthult 'ie automatisch en roept `onOnthuld` aan.
 */
export default function Kraslaag({
  hint = "Kras om te onthullen",
  onthoudSleutel,
  onOnthuld,
  children,
}: {
  hint?: string;
  onthoudSleutel?: string;
  onOnthuld?: () => void;
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tekenen = useRef(false);
  const meetTeller = useRef(0);
  const [onthuld, setOnthuld] = useState(false);

  useEffect(() => {
    if (onthoudSleutel && localStorage.getItem(onthoudSleutel)) {
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
    ctx.fillText(hint, width / 2, height / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onthul = () => {
    setOnthuld(true);
    if (onthoudSleutel) {
      try {
        localStorage.setItem(onthoudSleutel, "1");
      } catch {}
    }
    onOnthuld?.();
  };

  const meet = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
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
    const rect = canvas.getBoundingClientRect();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 24, 0, Math.PI * 2);
    ctx.fill();
    meetTeller.current = (meetTeller.current + 1) % 6;
    if (meetTeller.current === 0) meet();
  };

  return (
    <div
      ref={wrapRef}
      className="relative h-40 select-none overflow-hidden rounded-2xl border border-accent/40 bg-achtergrond"
    >
      <div className="flex h-full items-center justify-center">{children}</div>
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
  );
}
