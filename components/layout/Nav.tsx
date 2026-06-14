"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";

const links = [
  { href: "/missies", label: "Missies" },
  { href: "/word-een-star", label: "Word een star" },
  { href: "/verhalen", label: "Verhalen" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-lijn bg-achtergrond/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center text-tekst"
          aria-label="UXSTARS — naar home"
          onClick={() => setOpen(false)}
        >
          <Logo className="h-6 w-auto" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-base transition-colors duration-200 hover:text-tekst ${
                pathname.startsWith(link.href)
                  ? "text-tekst"
                  : "text-tekst-secundair"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Button href="/missie-plaatsen" size="sm">
            Plaats een missie
          </Button>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-expanded={open}
          aria-label={open ? "Menu sluiten" : "Menu openen"}
          onClick={() => setOpen(!open)}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 stroke-tekst"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-lijn px-4 pb-6 pt-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-tekst-secundair transition-colors duration-200 hover:text-tekst"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3">
            <Button href="/missie-plaatsen" onClick={() => setOpen(false)}>
              Plaats een missie
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
