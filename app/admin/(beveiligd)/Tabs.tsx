"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Missies in review" },
  { href: "/admin/reacties", label: "Reacties" },
  { href: "/admin/uitnodigingen", label: "Uitnodigingen" },
];

export default function Tabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-lijn">
      {tabs.map((tab) => {
        const actief = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
              actief
                ? "border-accent text-tekst"
                : "border-transparent text-tekst-secundair hover:text-tekst"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
