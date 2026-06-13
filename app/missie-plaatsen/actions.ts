"use server";

import { getSupabase } from "@/lib/supabase";
import { missieFormSchema } from "@/lib/validaties";

export type PlaatsMissieResultaat =
  | { ok: true; slug: string }
  | { ok: false; fout: "validatie" | "opslaan" | "geen-db" };

function slugify(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accenten weg
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * Slaat een ingediende missie op via de SECURITY DEFINER-functie plaats_missie.
 * Valideert eerst server-side opnieuw (nooit blind op de client vertrouwen).
 * De missie krijgt status 'in_review' en is dus nog niet publiek zichtbaar.
 */
export async function plaatsMissie(
  ruweData: unknown,
): Promise<PlaatsMissieResultaat> {
  const resultaat = missieFormSchema.safeParse(ruweData);
  if (!resultaat.success) return { ok: false, fout: "validatie" };
  const d = resultaat.data;

  const db = getSupabase();
  if (!db) return { ok: false, fout: "geen-db" };

  const slug = `${slugify(d.titel)}-${crypto.randomUUID().slice(0, 8)}`;
  const locatie =
    d.locatie === "Volledig remote"
      ? "Volledig remote"
      : `${d.locatie} · ${d.plaats ?? ""}`.trim();
  const intro =
    d.omschrijving.length > 180
      ? `${d.omschrijving.slice(0, 180).trimEnd()}…`
      : d.omschrijving;

  const { error } = await db.rpc("plaats_missie", {
    payload: {
      titel: d.titel,
      rol: d.rol,
      locatie,
      uren_per_week: d.urenPerWeek,
      duur: d.duur,
      tarief_indicatie: d.tarief,
      start_indicatie: d.start,
      intro,
      omschrijving: [d.omschrijving],
      slug,
      bedrijf: d.bedrijf,
      naam: d.naam,
      email: d.email,
      telefoon: d.telefoon ?? "",
    },
  });

  if (error) {
    console.error("plaats_missie fout:", error.message);
    return { ok: false, fout: "opslaan" };
  }
  return { ok: true, slug };
}
