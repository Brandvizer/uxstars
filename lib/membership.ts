// Eén membership-tier, twee betaalritmes + gratis proefperiode.
// Bedragen hier aanpassen wijzigt ze overal (wizard, prijssecties).

export const MEMBERSHIP = {
  naam: "UXSTARS Partner",
  trialDagen: 30,
  maand: { tier: "partner_maand", prijs: 149, periode: "per maand" },
  jaar: { tier: "partner_jaar", prijs: 1490, periode: "per jaar" },
} as const;

/** "€149" — heel getal zonder decimalen. */
export function euro(bedrag: number): string {
  return "€" + bedrag.toLocaleString("nl-NL");
}
