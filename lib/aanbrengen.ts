/**
 * Aanbrengbeloning: een ster brengt een opdrachtgever binnen; wordt die betalend
 * Partner, dan krijgt de ster een vaste beloning plus een extra vouch.
 * Bedrag en bewoording staan hier, zodat je ze op één plek aanpast.
 */
export const AANBRENGEN = {
  bedragCent: 14900,
  bedragTekst: "€149",
  /** Cookie waarin de aanbrengcode uit ?via= wordt bewaard tot registratie. */
  cookie: "uxs_via",
  cookieDagen: 90,
  factuurNaar: "hallo@uxstars.nl",
} as const;

/** Bouwt de persoonlijke aanbrenglink van een ster. */
export function aanbrengLink(basis: string, code: string): string {
  return `${basis.replace(/\/$/, "")}/bedrijf/welkom?via=${encodeURIComponent(code)}`;
}

/** Aanbrengcodes zijn UXS- plus vier tekens; alles anders wordt genegeerd. */
export function geldigeAanbrengCode(code: string | undefined | null): string | null {
  const c = (code ?? "").trim().toUpperCase();
  return /^UXS-[A-Z2-9]{4}$/.test(c) ? c : null;
}
