import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase";
import { stuurMail, emailHtml, esc } from "@/lib/mail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://uxstars.vercel.app";

type VouchKandidaat = { id: string; naam: string; email: string; token: string };
type BeschKandidaat = { id: string; naam: string; email: string };

function vouchMail(naam: string, link: string): string {
  return emailHtml({
    voorkop: "Jouw vouch",
    kop: `${naam.split(" ")[0]}, je vouch ligt nog klaar`,
    alineas: [
      "Jij bent al binnen: <strong>dit is jóuw vouch</strong> om iemand anders binnen te halen. Eén designer uit je netwerk mag jij een plek in het stelsel geven.",
      "Bewaar 'm voor wie er echt uitspringt. Eén klik en zij horen erbij.",
    ],
    knop: { label: "Geef je vouch", url: link },
  });
}

function beschikbaarheidMail(naam: string, link: string): string {
  return emailHtml({
    voorkop: "Even checken",
    kop: `${naam.split(" ")[0]}, klopt je beschikbaarheid nog?`,
    alineas: [
      "Je profiel is alweer even niet bijgewerkt. Beschikbare sterren lichten op in het stelsel en worden als eerste voor missies benaderd.",
      "Klopt je status nog? Eén blik op je profiel is genoeg.",
    ],
    knop: { label: "Bekijk je profiel", url: link },
  });
}

export async function GET(req: Request) {
  // Altijd een geldige CRON_SECRET vereisen. Zonder gezette secret draait er
  // niets — voorkomt dat de endpoint ooit ongeauthenticeerd mails verstuurt.
  // Vercel Cron stuurt automatisch 'Authorization: Bearer <CRON_SECRET>' mee.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = getSupabaseService();
  if (!svc) return NextResponse.json({ error: "geen db" }, { status: 500 });

  // Veilige testmodus: telt kandidaten zonder mail te sturen of te markeren.
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";

  let vouchVerstuurd = 0;
  let beschikbaarheidVerstuurd = 0;

  // 1. Vouch-herinneringen
  const { data: vouchData, error: vouchFout } = await svc.rpc("cron_vouch_kandidaten");
  if (vouchFout) console.error("cron_vouch_kandidaten:", vouchFout.message);
  const vouchLijst = (vouchData as VouchKandidaat[] | null) ?? [];

  const { data: beschData, error: beschFout } = await svc.rpc(
    "cron_beschikbaarheid_kandidaten",
  );
  if (beschFout) console.error("cron_beschikbaarheid_kandidaten:", beschFout.message);
  const beschLijst = (beschData as BeschKandidaat[] | null) ?? [];

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      vouchKandidaten: vouchLijst.length,
      beschikbaarheidKandidaten: beschLijst.length,
    });
  }

  for (const k of vouchLijst) {
    const link = `${SITE_URL}/uitnodiging/${k.token}`;
    const { ok } = await stuurMail({
      naar: k.email,
      onderwerp: "Je vouch ligt nog klaar ✦",
      html: vouchMail(esc(k.naam), link),
    });
    if (ok) {
      await svc.rpc("cron_markeer_vouch_nudge", { p_id: k.id });
      vouchVerstuurd++;
    }
  }

  // 2. Beschikbaarheids-pings
  for (const k of beschLijst) {
    const { ok } = await stuurMail({
      naar: k.email,
      onderwerp: "Klopt je beschikbaarheid nog?",
      html: beschikbaarheidMail(esc(k.naam), `${SITE_URL}/account`),
    });
    if (ok) {
      await svc.rpc("cron_markeer_beschikbaarheid_nudge", { p_id: k.id });
      beschikbaarheidVerstuurd++;
    }
  }

  return NextResponse.json({ ok: true, vouchVerstuurd, beschikbaarheidVerstuurd });
}
