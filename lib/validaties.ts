import { z } from "zod";

export const rollen = [
  "UX Designer",
  "Product Designer",
  "UX Researcher",
  "Service Designer",
  "UX Writer",
  "Design Lead",
] as const;

export const urenOpties = [
  "8–16 uur p/w",
  "16–24 uur p/w",
  "24–32 uur p/w",
  "32–40 uur p/w",
] as const;

export const duurOpties = [
  "Tot 3 maanden",
  "3–6 maanden",
  "6–12 maanden",
  "Nog onbekend",
] as const;

export const locatieOpties = [
  "Volledig remote",
  "Hybride",
  "Op locatie",
] as const;

export const tariefOpties = [
  "€70–85 p/u",
  "€85–100 p/u",
  "€100–120 p/u",
  "In overleg",
] as const;

export const startOpties = [
  "Zo snel mogelijk",
  "Binnen een maand",
  "Over 1–3 maanden",
  "Datum staat nog niet vast",
] as const;

// Eén schema per formstap, zodat elke stap los gevalideerd kan worden
export const stapSchemas = {
  rol: z.object({
    rol: z.enum(rollen, { error: "Kies een rol om verder te gaan" }),
  }),
  missie: z.object({
    titel: z
      .string({ error: "Geef je missie een titel" })
      .min(10, "Geef je missie een titel van minimaal 10 tekens"),
    omschrijving: z
      .string({ error: "Vertel kort waar de missie over gaat" })
      .min(40, "Vertel iets meer — minimaal 40 tekens helpt sterren kiezen"),
  }),
  omvang: z.object({
    urenPerWeek: z.enum(urenOpties, { error: "Kies het aantal uren" }),
    duur: z.enum(duurOpties, { error: "Kies de verwachte duur" }),
  }),
  locatie: z
    .object({
      locatie: z.enum(locatieOpties, { error: "Kies een werkvorm" }),
      plaats: z.string().optional(),
    })
    .refine(
      (data) => data.locatie === "Volledig remote" || (data.plaats ?? "").trim().length > 1,
      { message: "Vul de plaats in", path: ["plaats"] },
    ),
  tarief: z.object({
    tarief: z.enum(tariefOpties, { error: "Kies een tariefindicatie" }),
  }),
  start: z.object({
    start: z.enum(startOpties, { error: "Kies een startmoment" }),
  }),
  contact: z.object({
    naam: z.string({ error: "Vul je naam in" }).min(2, "Vul je naam in"),
    bedrijf: z
      .string({ error: "Vul je organisatie in" })
      .min(2, "Vul je organisatie in"),
    email: z.email("Vul een geldig e-mailadres in"),
    telefoon: z.string().optional(),
  }),
};

export const missieFormSchema = z
  .object({
    ...stapSchemas.rol.shape,
    ...stapSchemas.missie.shape,
    ...stapSchemas.omvang.shape,
    locatie: z.enum(locatieOpties, { error: "Kies een werkvorm" }),
    plaats: z.string().optional(),
    ...stapSchemas.tarief.shape,
    ...stapSchemas.start.shape,
    ...stapSchemas.contact.shape,
  })
  .superRefine((data, ctx) => {
    if (
      data.locatie &&
      data.locatie !== "Volledig remote" &&
      (data.plaats ?? "").trim().length < 2
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Vul de plaats in",
        path: ["plaats"],
      });
    }
  });

export type MissieFormData = z.infer<typeof missieFormSchema>;
