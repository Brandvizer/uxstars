"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Missies in review" },
  { href: "/admin/aanmeldingen", label: "Aanmeldingen" },
  { href: "/admin/reacties", label: "Reacties" },
  { href: "/admin/uitnodigingen", label: "Uitnodigingen" },
  { href: "/admin/bedrijven", label: "Bedrijven" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/plaatsingen", label: "Plaatsingen" },
  { href: "/admin/wachtlijst", label: "Wachtlijst" },
  { href: "/admin/accounts", label: "Accounts" },
];

export default function Tabs({ tellingen }: { tellingen: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-lijn px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
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
    </nav>
  );
}
