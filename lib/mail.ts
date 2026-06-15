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
const LOGO_URL = `${SITE_URL}/email-logo-light.png`;

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
    ? `<p style="margin:0 0 10px;font:600 12px ${FONT};letter-spacing:0.15em;text-transform:uppercase;color:#a8740f;">${opts.voorkop}</p>`
    : "";

  const alineas = opts.alineas
    .filter(Boolean)
    .map(
      (a) =>
        `<p style="margin:0 0 14px;font:400 15px/1.7 ${FONT};color:#444b5a;">${a}</p>`,
    )
    .join("");

  const knop = opts.knop
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px;"><tr>
        <td align="center" bgcolor="#ffd166" style="border-radius:999px;mso-padding-alt:13px 28px;">
          <a href="${opts.knop.url}" style="display:inline-block;padding:13px 28px;font:600 15px ${FONT};color:#0a0e1a;text-decoration:none;border-radius:999px;">${opts.knop.label}</a>
        </td></tr></table>`
    : "";

  // Bewust kale mail: geen achtergrond, kaart of randen — alleen logo, titel,
  // tekst en knop. Zo valt er niets te "washen" of te inverteren. De tekst is
  // donker (leesbaar op licht); donkere-modus-clients keren 'm netjes om.
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  body{margin:0;padding:0;width:100% !important;}
  a{text-decoration:none;}
</style>
</head>
<body style="margin:0;padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td align="center" style="padding:32px 20px;">
    <!--[if mso]><table role="presentation" width="480" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;margin:0 auto;">
      <tr><td style="padding:0 0 26px;">
        <img src="${LOGO_URL}" width="150" height="60" alt="UXSTARS" style="display:block;border:0;outline:none;text-decoration:none;height:60px;width:150px;" />
      </td></tr>
      <tr><td>
        ${voorkop}
        <h1 style="margin:0 0 16px;font:600 24px/1.3 ${FONT};color:#0a0e1a;">${opts.kop}</h1>
        ${alineas}
        ${knop}
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>
</table>
</body></html>`;
}
