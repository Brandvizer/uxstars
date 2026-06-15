import type { Ster } from "./mock-data";

/**
 * Het sterrenveld toont altijd een vast aantal gezichten. Die worden gevuld met
 * echte members die toestemming gaven (random gekozen). Zijn er te weinig, dan
 * wordt aangevuld met placeholder-portretten ("mensen die niet bestaan").
 * Naarmate er meer echte members met toestemming zijn, schuiven die erin.
 */
const AANTAL_GEZICHTEN = 9;

// Placeholder-portretten. Vervang later door een eigen, gehoste set
// AI-gegenereerde gezichten; de logica hieronder blijft gelijk.
const NEP_GEZICHTEN = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/men/75.jpg",
  "https://randomuser.me/api/portraits/women/12.jpg",
  "https://randomuser.me/api/portraits/men/41.jpg",
  "https://randomuser.me/api/portraits/women/90.jpg",
  "https://randomuser.me/api/portraits/men/9.jpg",
  "https://randomuser.me/api/portraits/women/29.jpg",
  "https://randomuser.me/api/portraits/men/55.jpg",
  "https://randomuser.me/api/portraits/women/57.jpg",
  "https://randomuser.me/api/portraits/men/86.jpg",
];

function meng<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Wijst aan precies AANTAL_GEZICHTEN sterren een foto toe (echt + aangevuld met
 * placeholders); de rest blijft een stipje. Random per render.
 */
export function wijsGezichtenToe(sterren: Ster[]): Ster[] {
  const echt = sterren.filter((s) => s.foto_url);
  const rest = sterren.filter((s) => !s.foto_url);

  const gekozenEcht = meng(echt).slice(0, AANTAL_GEZICHTEN);
  const aantalNep = Math.max(0, AANTAL_GEZICHTEN - gekozenEcht.length);
  const nepSterren = meng(rest).slice(0, aantalNep);
  const nepUrls = meng(NEP_GEZICHTEN);

  const fotoVoor = new Map<string, string>();
  gekozenEcht.forEach((s) => fotoVoor.set(s.id, s.foto_url as string));
  nepSterren.forEach((s, i) =>
    fotoVoor.set(s.id, nepUrls[i % nepUrls.length]),
  );

  return sterren.map((s) => ({ ...s, foto_url: fotoVoor.get(s.id) ?? null }));
}
