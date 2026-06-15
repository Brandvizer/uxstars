"use client";

import { useEffect, useRef, useState } from "react";
import { positieVoorId, tekenSter, tekenAvatar, KLEUREN } from "./Star";
import type { Ster } from "@/lib/mock-data";

const MAX_STERREN = 60;
const PARALLAX_MAX = 40; // px — merkbaar maar subtiel; sterren drijven niet weg
const PARALLAX_FACTOR = 0.06;

// Per ster: de databron plus de stabiele, geseede tekengegevens
type VeldSter = Ster & ReturnType<typeof positieVoorId>;

type Tooltip = {
  specialisme: string;
  seniority: string;
  px: number;
  py: number;
};

export default function StarField({
  sterren,
  interactief = true,
  className = "",
}: {
  sterren: Ster[];
  interactief?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  // Refs voor waarden die per frame veranderen — geen React re-render per frame
  const tooltipIdRef = useRef<string | null>(null);
  const parallaxRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Bouw de velddata eenmalig op: max 60 sterren, posities geseed op id
    const veldSterren: VeldSter[] = sterren
      .slice(0, MAX_STERREN)
      .map((s) => ({ ...s, ...positieVoorId(s.id) }));
    const perId = new Map(veldSterren.map((s) => [s.id, s]));

    // Verbindingen ontdubbelen tot unieke paren (a–b == b–a)
    const paren: [VeldSter, VeldSter][] = [];
    const gezien = new Set<string>();
    for (const s of veldSterren) {
      for (const doelId of s.verbindingen ?? []) {
        const doel = perId.get(doelId);
        if (!doel) continue;
        const sleutel = [s.id, doelId].sort().join("|");
        if (gezien.has(sleutel)) continue;
        gezien.add(sleutel);
        paren.push([s, doel]);
      }
    }

    // Avatar-beelden laden voor sterren met (toegestane) foto.
    const AVATAR_STRAAL = 20;
    const beelden = new Map<string, HTMLImageElement>();
    // Bij reduced motion draait er geen lus → hertekenen zodra een foto laadt.
    let herteken = () => {};
    for (const s of veldSterren) {
      if (s.foto_url) {
        const img = new Image();
        img.onload = () => herteken();
        img.src = s.foto_url;
        beelden.set(s.id, img);
      }
    }
    const avatarVan = (s: VeldSter) => {
      const img = beelden.get(s.id);
      return img && img.complete && img.naturalWidth > 0 ? img : null;
    };

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

    const px = (s: VeldSter) => s.fx * breedte;
    const py = (s: VeldSter) => s.fy * hoogte + parallaxRef.current;

    const teken = (tijd: number) => {
      ctx.clearRect(0, 0, breedte, hoogte);

      // Verbindingslijnen: het stelsel
      ctx.strokeStyle = KLEUREN.lijn;
      ctx.lineWidth = 1;
      for (const [a, b] of paren) {
        ctx.beginPath();
        ctx.moveTo(px(a), py(a));
        ctx.lineTo(px(b), py(b));
        ctx.stroke();
      }

      // De sterren zelf — leden met foto als avatar, de rest als twinkelend stipje
      for (const s of veldSterren) {
        const actief = s.id === tooltipIdRef.current;
        const img = avatarVan(s);
        if (img) {
          tekenAvatar(
            ctx,
            img,
            px(s),
            py(s),
            AVATAR_STRAAL * (actief ? 1.12 : 1),
            s.beschikbaar,
            actief,
          );
        } else {
          const alpha = reducedMotion
            ? 0.9
            : 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(tijd * 0.0009 + s.fase));
          tekenSter(ctx, px(s), py(s), s.grootte, alpha, s.beschikbaar, actief);
        }
      }
    };

    const lus = (tijd: number) => {
      // Parallax: veld beweegt heel licht mee met scroll, gemaximeerd op 20px
      if (!reducedMotion) {
        parallaxRef.current = Math.max(
          -PARALLAX_MAX,
          Math.min(PARALLAX_MAX, window.scrollY * PARALLAX_FACTOR),
        );
      }
      if (zichtbaar) teken(tijd);
      frame = requestAnimationFrame(lus);
    };

    // Nu teken bestaat: laat geladen avatars in reduced-motion een herteken doen.
    herteken = () => {
      if (reducedMotion && zichtbaar) teken(0);
    };

    resize();
    if (reducedMotion) {
      teken(0); // statische render, geen animatielus
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

    const zoekSter = (clientX: number, clientY: number): VeldSter | null => {
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      for (const s of veldSterren) {
        const afstand = Math.hypot(mx - px(s), my - py(s));
        const raak = avatarVan(s) ? AVATAR_STRAAL + 4 : Math.max(18, s.grootte * 6);
        if (afstand < raak) return s;
      }
      return null;
    };

    const toon = (s: VeldSter | null) => {
      tooltipIdRef.current = s?.id ?? null;
      setTooltip(
        s
          ? {
              specialisme: s.specialisme,
              seniority: s.seniority,
              px: px(s),
              py: py(s),
            }
          : null,
      );
    };

    // Desktop: hover. Mobiel: tap (toggelt de tooltip).
    const opMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const gevonden = zoekSter(e.clientX, e.clientY);
      if (gevonden?.id !== tooltipIdRef.current) toon(gevonden);
      canvas.style.cursor = gevonden ? "pointer" : "default";
    };
    const opTap = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const gevonden = zoekSter(e.clientX, e.clientY);
      toon(gevonden?.id === tooltipIdRef.current ? null : gevonden);
    };
    const opLeave = () => {
      if (tooltipIdRef.current) toon(null);
    };

    if (interactief) {
      canvas.addEventListener("pointermove", opMove);
      canvas.addEventListener("pointerdown", opTap);
      canvas.addEventListener("pointerleave", opLeave);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersect.disconnect();
      canvas.removeEventListener("pointermove", opMove);
      canvas.removeEventListener("pointerdown", opTap);
      canvas.removeEventListener("pointerleave", opLeave);
    };
  }, [sterren, interactief]);

  return (
    // De meegegeven className bepaalt de positie (bijv. "absolute inset-0").
    // Géén harde `relative` ervoor: dat wint in Tailwind van `absolute` en
    // zou het veld als in-flow blok bóven de tekst laten staan i.p.v. erachter.
    // Valt terug op `relative` als positiecontext voor de tooltip.
    <div ref={containerRef} className={className || "relative"}>
      <canvas ref={canvasRef} className="block h-full w-full" />
      {tooltip && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-lijn bg-paneel px-4 py-2.5 text-sm shadow-xl"
          style={{ left: tooltip.px, top: tooltip.py + 16 }}
        >
          <p className="font-semibold text-tekst">{tooltip.specialisme}</p>
          <p className="text-tekst-secundair">{tooltip.seniority}</p>
        </div>
      )}
    </div>
  );
}
