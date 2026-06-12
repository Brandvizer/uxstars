import type { Ster } from "@/lib/mock-data";

export const KLEUREN = {
  ster: "#F2F4F8",
  gloed: "#F5B941",
  beschikbaar: "#4ADE80",
  lijn: "#2A3350",
};

/**
 * Tekent één ster op het canvas. Beschikbare sterren krijgen een
 * zachte groene gloed; twinkelen gebeurt uitsluitend via alpha.
 */
export function tekenSter(
  ctx: CanvasRenderingContext2D,
  ster: Ster,
  px: number,
  py: number,
  alpha: number,
  actief: boolean,
) {
  const straal = ster.grootte * (actief ? 1.4 : 1);

  if (ster.beschikbaar) {
    const gloed = ctx.createRadialGradient(px, py, 0, px, py, straal * 5);
    gloed.addColorStop(0, `rgba(74, 222, 128, ${0.35 * alpha})`);
    gloed.addColorStop(1, "rgba(74, 222, 128, 0)");
    ctx.fillStyle = gloed;
    ctx.beginPath();
    ctx.arc(px, py, straal * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (actief) {
    const ring = ctx.createRadialGradient(px, py, 0, px, py, straal * 6);
    ring.addColorStop(0, "rgba(245, 185, 65, 0.45)");
    ring.addColorStop(1, "rgba(245, 185, 65, 0)");
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(px, py, straal * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = alpha;
  ctx.fillStyle = actief ? KLEUREN.gloed : KLEUREN.ster;
  ctx.beginPath();
  ctx.arc(px, py, straal, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
