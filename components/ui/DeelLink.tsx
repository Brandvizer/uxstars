"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

/**
 * Zichtbare link met kopieerknop. Eén mechanisme voor alles wat een ster
 * deelt (vouch-link, aanbrenglink), zodat het overal hetzelfde werkt.
 */
export default function DeelLink({
  uitleg,
  url,
  naschrift,
}: {
  uitleg: string;
  url: string;
  naschrift?: React.ReactNode;
}) {
  const [gekopieerd, setGekopieerd] = useState(false);

  const kopieer = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {}
  };

  return (
    <div className="rounded-xl border border-lijn bg-achtergrond p-4">
      <p className="tekst-klein text-tekst-secundair">{uitleg}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-paneel px-3 py-2 text-sm text-tekst">
          {url}
        </code>
        <Button type="button" size="sm" variant="ghost" onClick={kopieer}>
          {gekopieerd ? "Gekopieerd" : "Kopieer link"}
        </Button>
      </div>
      {naschrift && <p className="mt-2 tekst-klein text-tekst-secundair">{naschrift}</p>}
    </div>
  );
}
