"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string };
type Groep = { titel: string | null; tabs: Tab[] };

// Gegroepeerd op wie het betreft: designers, opdrachtgevers, of de deal ertussen.
const groepen: Groep[] = [
  { titel: null, tabs: [{ href: "/admin/dashboard", label: "Dashboard" }] },
  {
    titel: "Designers",
    tabs: [
      { href: "/admin/aanmeldingen", label: "Aanmeldingen" },
      { href: "/admin/uitnodigingen", label: "Uitnodigingen" },
      { href: "/admin/reacties", label: "Reacties" },
      { href: "/admin/accounts", label: "Accounts" },
    ],
  },
  {
    titel: "Opdrachtgevers",
    tabs: [
      { href: "/admin", label: "Missies in review" },
      { href: "/admin/bedrijven", label: "Bedrijven" },
      { href: "/admin/leads", label: "Leads" },
      { href: "/admin/wachtlijst", label: "Wachtlijst" },
    ],
  },
  {
    titel: "Deals",
    tabs: [
      { href: "/admin/plaatsingen", label: "Plaatsingen" },
      { href: "/admin/beloningen", label: "Beloningen" },
    ],
  },
];

export default function Tabs({ tellingen }: { tellingen: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Beheer"
      className="-mx-4 flex gap-6 overflow-x-auto border-b border-lijn px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {groepen.map((groep, i) => (
        <div key={groep.titel ?? "los"} className="flex shrink-0 flex-col">
          {/* Groepslabel; lege regel bij losse tabs zodat alles op één lijn staat */}
          <p
            className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              groep.titel ? "text-tekst-secundair/70" : "invisible"
            } ${i > 0 ? "pl-4" : ""}`}
            aria-hidden={groep.titel ? undefined : true}
          >
            {groep.titel ?? "•"}
          </p>
          <div className={`flex gap-1 ${i > 0 ? "border-l border-lijn" : ""}`}>
            {groep.tabs.map((tab) => {
              const actief = pathname === tab.href;
              const aantal = tellingen[tab.href] ?? 0;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                    actief
                      ? "border-accent text-tekst"
                      : "border-transparent text-tekst-secundair hover:text-tekst"
                  }`}
                >
                  {tab.label}
                  {aantal > 0 && (
                    <span
                      className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent/15 px-1.5 py-0.5 text-xs font-semibold text-accent"
                      aria-label={`${aantal} nieuw`}
                    >
                      {aantal}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
