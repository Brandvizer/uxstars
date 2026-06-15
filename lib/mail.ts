const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Afzender op het geverifieerde domein.
const AFZENDER = "UXSTARS <missies@uxstars.nl>";

export const mailGeconfigureerd = Boolean(RESEND_API_KEY);

/**
 * Verstuurt een e-mail via de Resend API. Geeft {ok:false} als er geen
 * RESEND_API_KEY is geconfigureerd of als Resend een fout teruggeeft.
 */
export async function stuurMail({
  naar,
  onderwerp,
  html,
  replyTo,
}: {
  naar: string;
  onderwerp: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean }> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY ontbreekt — mail niet verstuurd");
    return { ok: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: AFZENDER,
      to: naar,
      subject: onderwerp,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    console.error("Resend-fout:", res.status, await res.text());
    return { ok: false };
  }
  return { ok: true };
}

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Absolute URL naar het gehoste logo (e-mailclients laden geen lokale/SVG-assets).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://uxstars.vercel.app";
const LOGO_URL = `${SITE_URL}/email-logo.png`;

/** Escapet door gebruikers aangeleverde tekst voor in HTML. */
export function esc(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
}

/**
 * On-brand HTML-mailtemplate (donker, met de gouden UXSTARS-ster). Table-based
 * met inline styles voor brede e-mailclient-ondersteuning. `alineas` mag simpele
 * HTML bevatten (links etc.) — escape gebruikersinvoer zelf met esc().
 */
export function emailHtml(opts: {
  voorkop?: string;
  kop: string;
  alineas: string[];
  knop?: { label: string; url: string };
}): string {
  const voorkop = opts.voorkop
    ? `<p style="margin:0 0 12px;font:600 12px ${FONT};letter-spacing:0.15em;text-transform:uppercase;color:#f5b941;">${opts.voorkop}</p>`
    : "";

  const alineas = opts.alineas
    .filter(Boolean)
    .map(
      (a) =>
        `<p style="margin:0 0 14px;font:400 15px/1.65 ${FONT};color:#8b93a7;">${a}</p>`,
    )
    .join("");

  const knop = opts.knop
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 2px;"><tr>
        <td bgcolor="#f5b941" style="border-radius:999px;">
          <a href="${opts.knop.url}" style="display:inline-block;padding:13px 26px;font:600 15px ${FONT};color:#0a0e1a;text-decoration:none;border-radius:999px;">${opts.knop.label}</a>
        </td></tr></table>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"></head>
<body style="margin:0;padding:0;background:#0a0e1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0e1a" style="background:#0a0e1a;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
      <tr><td style="padding:0 4px 22px;">
        <img src="${LOGO_URL}" width="150" height="60" alt="UXSTARS" style="display:block;border:0;outline:none;text-decoration:none;height:60px;width:150px;" />
      </td></tr>
      <tr><td style="background:#111729;border:1px solid #2a3350;border-radius:16px;padding:30px;">
        ${voorkop}
        <h1 style="margin:0 0 14px;font:600 23px/1.3 ${FONT};color:#f2f4f8;">${opts.kop}</h1>
        ${alineas}
        ${knop}
      </td></tr>
      <tr><td style="padding:22px 4px 0;font:400 12px/1.5 ${FONT};color:#8b93a7;">
        UXSTARS — het sterrenstelsel van UX-talent
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}
