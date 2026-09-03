import { NextResponse, type NextRequest } from "next/server";

/**
 * Herschrijft een ruwe missie-omschrijving (steekwoorden, geplakte vacature,
 * ingesproken tekst) naar een nette UXSTARS-missie. Doet een titelvoorstel als
 * de titel nog leeg is. Eén aanroep per klik; de opdrachtgever kiest zelf of
 * het voorstel wordt overgenomen.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
const MAX_TEKENS = 4000;

// Eenvoudige limiet per IP (in het geheugen van de serverless-instantie).
// Voldoende tegen misbruik van de knop; geen harde garantie over instanties heen.
const LIMIET_PER_UUR = 20;
const teller = new Map<string, { n: number; tot: number }>();
function overLimiet(ip: string): boolean {
  const nu = Date.now();
  const rec = teller.get(ip);
  if (!rec || rec.tot < nu) {
    teller.set(ip, { n: 1, tot: nu + 60 * 60 * 1000 });
    return false;
  }
  rec.n += 1;
  return rec.n > LIMIET_PER_UUR;
}

const SYSTEEM = `Je schrijft missie-omschrijvingen voor UXSTARS, een besloten netwerk van gevouchte digital designers (UX, UI, product, service, visual). Opdrachtgevers plaatsen een missie; designers reageren.

Je krijgt ruwe input van een opdrachtgever: steekwoorden, een half verhaal, een geplakte vacaturetekst of ingesproken taal. Maak daar een heldere missie-omschrijving van.

Regels:
- Nederlands, je-vorm richting de designer, vlot en concreet. Geen jargon, geen wervende bijvoeglijke naamwoorden, geen uitroeptekens.
- Drie korte alinea's, zonder kopjes: (1) het probleem of de kans, (2) het team en de context waarin de designer werkt, (3) wat er over een half jaar moet staan. Samen 80 tot 160 woorden.
- Gebruik alleen informatie uit de input. Verzin geen cijfers, namen, tools of teamgroottes. Is iets onbekend, laat het weg.
- Gebruik nooit gedachtestreepjes. Gebruik een punt, dubbele punt of komma.
- Schrijf "digital designer", niet "UX'er" of "UX-designer", tenzij de input uitdrukkelijk om één discipline vraagt.
- Als er geen titel is meegegeven, stel er een voor: maximaal 8 woorden, zonder bedrijfsnaam, zonder punt, geen hoofdletters op elk woord.
- Stel daarna maximaal 2 korte vervolgvragen over wat een designer nog mist om te beoordelen of de missie bij hem of haar past. Denk aan: voor wie is het product, wat is de huidige situatie, welke beslissers zijn betrokken, waarom nu. Vraag NIET naar rol, uren per week, duur, locatie, startdatum of tarief; dat wordt elders in het formulier gevraagd. Is de tekst al compleet, geef dan een lege lijst.
- Als de input een blok "Aanvullende antwoorden" bevat, verwerk die antwoorden in de omschrijving en stel geen vragen meer die daarmee beantwoord zijn.

Antwoord uitsluitend met JSON in deze vorm, zonder toelichting:
{"titel": "...", "omschrijving": "...", "vragen": ["...", "..."]}
Laat "titel" leeg ("") als er al een titel was meegegeven.`;

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { fout: "Opschonen is nog niet ingeschakeld." },
      { status: 503 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend";
  if (overLimiet(ip)) {
    return NextResponse.json(
      { fout: "Even rustig aan, probeer het over een uur opnieuw." },
      { status: 429 },
    );
  }

  let body: { titel?: unknown; omschrijving?: unknown; antwoorden?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fout: "Ongeldige aanvraag." }, { status: 400 });
  }
  const titel = typeof body.titel === "string" ? body.titel.trim() : "";
  const ruw =
    typeof body.omschrijving === "string" ? body.omschrijving.trim() : "";
  if (ruw.split(/\s+/).filter(Boolean).length < 3) {
    return NextResponse.json(
      { fout: "Typ eerst een paar woorden over de missie." },
      { status: 400 },
    );
  }

  const antwoorden =
    typeof body.antwoorden === "string" ? body.antwoorden.trim() : "";
  const invoer = [
    titel ? `Titel (al ingevuld): ${titel}` : "Titel: (nog leeg)",
    "",
    "Ruwe omschrijving:",
    ruw.slice(0, MAX_TEKENS),
    ...(antwoorden
      ? ["", "Aanvullende antwoorden van de opdrachtgever:", antwoorden.slice(0, 1500)]
      : []),
  ].join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      // Nieuwe (identity-linked) keys vereisen de workspace waarin je werkt.
      ...(process.env.ANTHROPIC_WORKSPACE_ID && {
        "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID,
      }),
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.4,
      system: SYSTEEM,
      messages: [{ role: "user", content: invoer }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Anthropic-fout", res.status, detail);
    return NextResponse.json(
      {
        fout: "Opschonen lukte even niet. Probeer het zo nog eens.",
        // Alleen lokaal: de echte foutmelding, zodat je ziet wat er mis is.
        ...(process.env.NODE_ENV !== "production" && {
          detail: `${res.status} ${detail.slice(0, 300)}`,
        }),
      },
      { status: 502 },
    );
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const tekst = data.content?.find((c) => c.type === "text")?.text ?? "";

  // Het model antwoordt met JSON; pak het eerste {…}-blok voor de zekerheid.
  const match = tekst.match(/\{[\s\S]*\}/);
  let uit: { titel?: string; omschrijving?: string; vragen?: unknown } = {};
  try {
    uit = match ? JSON.parse(match[0]) : {};
  } catch {
    uit = {};
  }
  const omschrijving = (uit.omschrijving ?? "").trim();
  if (!omschrijving) {
    return NextResponse.json(
      { fout: "Er kwam geen bruikbare tekst terug. Probeer het nog eens." },
      { status: 502 },
    );
  }

  const titelVoorstel = titel ? "" : (uit.titel ?? "").trim();
  return NextResponse.json({
    // Eerste letter altijd een hoofdletter, de rest zoals het model het schreef.
    titel: titelVoorstel
      ? titelVoorstel.charAt(0).toUpperCase() + titelVoorstel.slice(1)
      : "",
    omschrijving,
    vragen: Array.isArray(uit.vragen)
      ? uit.vragen.filter((v): v is string => typeof v === "string" && v.trim() !== "").slice(0, 2)
      : [],
  });
}
