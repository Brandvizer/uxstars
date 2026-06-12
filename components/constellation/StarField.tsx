"use client";

import { useEffect, useRef, useState } from "react";
import { useStarData } from "./useStarData";
import { tekenSter, KLEUREN } from "./Star";
import type { Ster } from "@/lib/mock-data";

type AchtergrondSter = {
  x: number;
  y: number;
  straal: number;
  fase: number;
  snelheid: number;
};

type Tooltip = {
  ster: Ster;
  px: number;
  py: number;
};

// Deterministische pseudo-random zodat het veld er elke render hetzelfde uitziet
function maakAchtergrondSterren(aantal: number): AchtergrondSter[] {
  const sterren: AchtergrondSter[] = [];
  let zaad = 42;
  const rnd = () => {
    zaad = (zaad * 16807) % 2147483647;
    return zaad / 2147483647;
  };
  for (let i = 0; i < aantal; i++) {
    sterren.push({
      x: rnd(),
      y: rnd(),
      straal: 0.4 + rnd() * 1.1,
      fase: rnd() * Math.PI * 2,
      snelheid: 0.3 + rnd() * 0.7,
    });
  }
  return sterren;
}

export default function StarField({
  interactief = true,
  className = "",
}: {
  interactief?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { sterren, vouches } = useStarData();
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const tooltipRef = useRef<Tooltip | null>(null);
  tooltipRef.current = tooltip;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const achtergrond = maakAchtergrondSterren(140);
    const perId = new Map(sterren.map((s) => [s.id, s]));
    let breedte = 0;
    let hoogte = 0;
    let frame = 0;
    let zichtbaar = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      breedte = container.clientWidth;
      hoogte = container.clientHeight;
      canvas.width = breedte * dpr;
      canvas.height = hoogte * dpr;
      canvas.style.width = `${breedte}px`;
      canvas.style.height = `${hoogte}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const teken = (tijd: number) => {
      ctx.clearRect(0, 0, breedte, hoogte);

      // Decoratieve achtergrondsterren: twinkelen alleen via opacity
      for (const s of achtergrond) {
        const alpha = reducedMotion
          ? 0.5
          : 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(tijd * 0.001 * s.snelheid + s.fase));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = KLEUREN.ster;
        ctx.beginPath();
        ctx.arc(s.x * breedte, s.y * hoogte, s.straal, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Vouch-lijnen: het stelsel
      ctx.strokeStyle = KLEUREN.lijn;
      ctx.lineWidth = 1;
      for (const v of vouches) {
        const a = perId.get(v.van);
        const b = perId.get(v.naar);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x * breedte, a.y * hoogte);
        ctx.lineTo(b.x * breedte, b.y * hoogte);
        ctx.stroke();
      }

      // De sterren zelf
      const actiefId = tooltipRef.current?.ster.id;
      sterren.forEach((ster, i) => {
        const alpha = reducedMotion
          ? 0.95
          : 0.75 + 0.25 * (0.5 + 0.5 * Math.sin(tijd * 0.0008 + i * 1.7));
        tekenSter(
          ctx,
          ster,
          ster.x * breedte,
          ster.y * hoogte,
          alpha,
          ster.id === actiefId,
        );
      });
    };

    const lus = (tijd: number) => {
      if (zichtbaar) teken(tijd);
      frame = requestAnimationFrame(lus);
    };

    resize();
    if (reducedMotion) {
      teken(0);
    } else {
      frame = requestAnimationFrame(lus);
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (reducedMotion) teken(0);
    });
    observer.observe(container);

    // Niet tekenen als het veld buiten beeld is (scrollen, andere tab)
    const intersect = new IntersectionObserver(([entry]) => {
      zichtbaar = entry.isIntersecting;
    });
    intersect.observe(container);

    const zoekSter = (clientX: number, clientY: number): Tooltip | null => {
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      for (const ster of sterren) {
        const px = ster.x * breedte;
        const py = ster.y * hoogte;
        const afstand = Math.hypot(mx - px, my - py);
        if (afstand < Math.max(18, ster.grootte * 6)) {
          return { ster, px, py };
        }
      }
      return null;
    };

    const opBeweging = (e: PointerEvent) => {
      const gevonden = zoekSter(e.clientX, e.clientY);
      const huidig = tooltipRef.current;
      if (gevonden?.ster.id !== huidig?.ster.id) setTooltip(gevonden);
      canvas.style.cursor = gevonden ? "pointer" : "default";
    };
    const opVerlaten = () => setTooltip(null);

    if (interactief) {
      canvas.addEventListener("pointermove", opBeweging);
      canvas.addEventListener("pointerdown", opBeweging);
      canvas.addEventListener("pointerleave", opVerlaten);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersect.disconnect();
      canvas.removeEventListener("pointermove", opBeweging);
      canvas.removeEventListener("pointerdown", opBeweging);
      canvas.removeEventListener("pointerleave", opVerlaten);
    };
  }, [sterren, vouches, interactief]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
      {tooltip && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-lijn bg-paneel px-4 py-2.5 text-sm shadow-xl"
          style={{ left: tooltip.px, top: tooltip.py + 16 }}
        >
          <p className="font-semibold text-tekst">{tooltip.ster.naam}</p>
          <p className="text-tekst-secundair">{tooltip.ster.rol}</p>
          {tooltip.ster.beschikbaar && (
            <p className="mt-1 flex items-center gap-1.5 text-succes">
              <span className="h-1.5 w-1.5 rounded-full bg-succes" />
              Beschikbaar voor een missie
            </p>
          )}
        </div>
      )}
    </div>
  );
}
