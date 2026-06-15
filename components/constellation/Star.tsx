export const KLEUREN = {
  ster: "#F2F4F8",
  beschikbaar: "#4ADE80", // succes-groen
  lijn: "#2A3350",
};

// Deterministische hash (FNV-1a + avalanche-finalizer), 32-bit unsigned.
// De finalizer is essentieel: zonder mixstap verschillen opeenvolgende ids
// (s1, s2, s3 …) maar in één byte, wat bijna gelijke fracties geeft en de
// sterren op één diagonaal legt. De mixstap spreidt die volledig uit.
function hash(tekst: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x21f0aaad);
  h ^= h >>> 15;
  h = Math.imul(h, 0x735a2d97);
  h ^= h >>> 15;
  return h >>> 0;
}

const fractie = (id: string, kanaal: string) =>
  hash(`${kanaal}:${id}`) / 0xffffffff;

export type SterPositie = {
  /** Positie als fractie (0–1) van het veld */
  fx: number;
  fy: number;
  /** Straal in px */
  grootte: number;
  /** Faseverschuiving voor het twinkelen */
  fase: number;
};

/**
 * Stabiele, semi-willekeurige positie geseed op de id. Een marge houdt
 * sterren van de randen; de grootte varieert subtiel per ster.
 */
export function positieVoorId(id: string): SterPositie {
  const marge = 0.06;
  const bereik = 1 - marge * 2;
  return {
    fx: marge + fractie(id, "x") * bereik,
    fy: marge + fractie(id, "y") * bereik,
    grootte: 1.8 + fractie(id, "g") * 1.8, // 1.8–3.6px
    fase: fractie(id, "f") * Math.PI * 2,
  };
}

/**
 * Tekent één ster. Beschikbare sterren krijgen een zachte groene gloed;
 * twinkelen gebeurt uitsluitend via de meegegeven alpha.
 */
export function tekenSter(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  grootte: number,
  alpha: number,
  beschikbaar: boolean,
  actief: boolean,
) {
  const straal = grootte * (actief ? 1.4 : 1);

  if (beschikbaar) {
    const gloed = ctx.createRadialGradient(px, py, 0, px, py, straal * 5);
    gloed.addColorStop(0, `rgba(74, 222, 128, ${0.4 * alpha})`);
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
  ctx.fillStyle = actief ? "#FFD166" : beschikbaar ? KLEUREN.beschikbaar : KLEUREN.ster;
  ctx.beginPath();
  ctx.arc(px, py, straal, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/**
 * Tekent een ster als ronde avatar (member met foto + toestemming). Beschikbare
 * leden gloeien groen; de actieve (hover) krijgt een gouden ring.
 */
export function tekenAvatar(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  px: number,
  py: number,
  straal: number,
  beschikbaar: boolean,
  actief: boolean,
) {
  if (beschikbaar) {
    const gloed = ctx.createRadialGradient(px, py, straal * 0.8, px, py, straal * 2);
    gloed.addColorStop(0, "rgba(74, 222, 128, 0.4)");
    gloed.addColorStop(1, "rgba(74, 222, 128, 0)");
    ctx.fillStyle = gloed;
    ctx.beginPath();
    ctx.arc(px, py, straal * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, straal, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, px - straal, py - straal, straal * 2, straal * 2);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(px, py, straal, 0, Math.PI * 2);
  ctx.lineWidth = actief ? 2 : 1.5;
  ctx.strokeStyle = actief
    ? "#FFD166"
    : beschikbaar
      ? KLEUREN.beschikbaar
      : "rgba(242, 244, 248, 0.35)";
  ctx.stroke();
}
