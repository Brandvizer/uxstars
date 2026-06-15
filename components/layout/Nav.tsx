"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const links = [
  { href: "/missies", label: "Missies" },
  { href: "/leden", label: "Het stelsel" },
  { href: "/word-een-star", label: "Word een star" },
  { href: "/verhalen", label: "Verhalen" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [ingelogd, setIngelogd] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => setIngelogd(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) =>
      setIngelogd(!!session),
    );
    return () => subscription.unsubscribe();
  }, []);

  const accountHref = ingelogd ? "/account" : "/account/login";
  const accountLabel = ingelogd ? "Mijn account" : "Inloggen";

  return (
    <header className="sticky top-0 z-50 border-b border-lijn bg-achtergrond/80 backdrop-blur-md">
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center text-tekst"
          aria-label="UXSTARS — naar home"
          onClick={() => setOpen(false)}
        >
          <Logo className="h-14 w-auto" />
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
          {ingelogd !== null && (
            <Button href={accountHref} variant="secundair" size="sm">
              {accountLabel}
            </Button>
          )}
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
          <div className="flex flex-col gap-3 pt-3">
            {ingelogd !== null && (
              <Button
                href={accountHref}
                variant="secundair"
                onClick={() => setOpen(false)}
              >
                {accountLabel}
              </Button>
            )}
            <Button href="/missie-plaatsen" onClick={() => setOpen(false)}>
              Plaats een missie
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
