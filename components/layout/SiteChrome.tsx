"use client";

import { usePathname } from "next/navigation";

/** Verbergt de site-nav + footer op geïsoleerde pagina's (zoals de teaser
 *  /vroeg), zodat daar geen uitstapjes zijn. Nav/footer komen als props binnen
 *  (server components), zodat we alleen beslissen of ze getoond worden. */
const KAAL = new Set(["/vroeg", "/vroeg/aanmelden"]);

export default function SiteChrome({
  nav,
  footer,
  children,
}: {
  nav: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const kaal = KAAL.has(usePathname());
  return (
    <>
      {!kaal && nav}
      <main className="flex-1">{children}</main>
      {!kaal && footer}
    </>
  );
}
