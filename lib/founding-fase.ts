/**
 * Founding-fase: het stelsel vult zich, maar er zijn nog geen missies.
 * Aan/uit via NEXT_PUBLIC_FOUNDING_FASE=true in Vercel. Op launchdag uitzetten
 * (of weghalen) en de site, mails en accountpagina gedragen zich weer normaal,
 * zonder codewijziging.
 */
export const FOUNDING_FASE = process.env.NEXT_PUBLIC_FOUNDING_FASE === "true";

/** Eén formulering, overal hetzelfde. */
export const FOUNDING_TEKST = {
  kort: "Het stelsel is nog niet open voor missies.",
  lang: "Je bent een van de eerste 100 sterren. Het stelsel is nog niet open voor missies: de komende weken vullen we het stelsel en halen we de eerste opdrachtgevers binnen. Jij hoort het als eerste.",
  nuDoen: "Dit kun je nu al doen",
} as const;
