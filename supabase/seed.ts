/**
 * Seed: vult een lege Supabase-database met voorbeelddata.
 *   • opdrachtgevers (afgeleid uit de missies)
 *   • 5 missies
 *   • 51 stars (status 'actief', met privé e-mail + tarief)
 *   • vouches (de verbindingen uit de mockdata)
 *
 * Gebruikt de SERVICE ROLE key: omzeilt RLS. Draaien met:
 *   npm run seed
 * (laadt .env.local via node --env-file)
 *
 * Idempotent: leegt eerst de tabellen, daarna opnieuw vullen.
 */
import { createClient } from "@supabase/supabase-js";
import { missies, sterren } from "../lib/mock-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "\n✗ Seed afgebroken: NEXT_PUBLIC_SUPABASE_URL en/of SUPABASE_SERVICE_ROLE_KEY ontbreken.\n" +
      "  Vul ze in in .env.local (zie .env.example) en draai opnieuw.\n",
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// Mislukte query → meteen stoppen met een duidelijke melding.
function check(stap: string, error: { message: string } | null) {
  if (error) {
    console.error(`✗ ${stap}: ${error.message}`);
    process.exit(1);
  }
}

async function seed() {
  console.log("→ Leegmaken (FK-veilige volgorde)…");
  for (const tabel of [
    "plaatsingen",
    "reacties",
    "vouches",
    "missies",
    "stars",
    "opdrachtgevers",
  ] as const) {
    const { error } = await db.from(tabel).delete().not("id", "is", null);
    check(`leegmaken ${tabel}`, error);
  }

  // ── Opdrachtgevers: één per unieke naam uit de missies ────────────────────
  const opdrachtgeverNamen = [...new Set(missies.map((m) => m.opdrachtgever))];
  const { data: ogRows, error: ogErr } = await db
    .from("opdrachtgevers")
    .insert(
      opdrachtgeverNamen.map((naam) => ({
        naam,
        contactpersoon: "Contactpersoon",
        email: `contact@${naam
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}.example`,
      })),
    )
    .select();
  check("opdrachtgevers", ogErr);
  const ogIdVoorNaam = new Map(ogRows!.map((r) => [r.naam, r.id as string]));

  // ── Missies ───────────────────────────────────────────────────────────────
  const { error: misErr } = await db.from("missies").insert(
    missies.map((m) => ({
      slug: m.slug,
      titel: m.titel,
      rol: m.rol,
      locatie: m.locatie,
      uren_per_week: m.urenPerWeek,
      tarief_indicatie: m.tariefIndicatie,
      seniority: m.seniority,
      status: m.status,
      intro: m.intro,
      omschrijving: m.omschrijving,
      opdrachtgever_id: ogIdVoorNaam.get(m.opdrachtgever) ?? null,
    })),
  );
  check("missies", misErr);

  // ── Stars (51), status 'actief' met privé e-mail + tarief ─────────────────
  const { data: starRows, error: starErr } = await db
    .from("stars")
    .insert(
      sterren.map((s, i) => ({
        naam: s.naam,
        specialisme: s.specialisme,
        seniority: s.seniority,
        beschikbaar: s.beschikbaar,
        status: "actief",
        // Privédata — RLS verbergt deze kolommen voor het publiek:
        email: `ster${i + 1}@uxstars.example`,
        tarief_uur: 75 + (i % 6) * 5,
      })),
    )
    .select();
  check("stars", starErr);

  // Map de mock-ids (s1…s51) naar de echte uuids via de unieke naam.
  const uuidVoorNaam = new Map(starRows!.map((r) => [r.naam, r.id as string]));
  const uuidVoorMockId = new Map(
    sterren.map((s) => [s.id, uuidVoorNaam.get(s.naam)!]),
  );

  // ── Vouches: de verbindingen uit de mockdata ──────────────────────────────
  const vouchRijen = sterren.flatMap((s) =>
    (s.verbindingen ?? []).map((doel) => ({
      van_star_id: uuidVoorMockId.get(s.id)!,
      naar_star_id: uuidVoorMockId.get(doel)!,
    })),
  );
  const { error: vouchErr } = await db.from("vouches").insert(vouchRijen);
  check("vouches", vouchErr);

  console.log(
    `✓ Seed klaar: ${opdrachtgeverNamen.length} opdrachtgevers, ${missies.length} missies, ` +
      `${sterren.length} stars, ${vouchRijen.length} vouches.`,
  );
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
