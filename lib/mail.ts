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
