"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const links = [
  { href: "/missies", label: "Missies" },
  { href: "/opdrachtgevers", label: "Opdrachtgevers" },
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
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Link
          href="/"
          className="flex items-center text-tekst"
          aria-label="UXSTARS — naar home"
          onClick={() => setOpen(false)}
        >
          <Logo className="h-10 w-auto sm:h-14" />
        </Link>

        <div className="hidden items-center gap-6 lg:flex xl:gap-8">
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
          className="relative flex h-10 w-10 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Menu sluiten" : "Menu openen"}
          onClick={() => setOpen(!open)}
        >
          <span className="relative block h-6 w-6">
            <span
              className={`absolute left-0 h-0.5 w-6 rounded-full bg-tekst transition-all duration-300 ${
                open ? "top-[11px] rotate-45" : "top-[7px]"
              }`}
            />
            <span
              className={`absolute left-0 top-[11px] h-0.5 w-6 rounded-full bg-tekst transition-all duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 h-0.5 w-6 rounded-full bg-tekst transition-all duration-300 ${
                open ? "top-[11px] -rotate-45" : "top-[15px]"
              }`}
            />
          </span>
        </button>
      </nav>

      {open && (
        <div className="menu-paneel border-t border-lijn bg-achtergrond/95 px-4 pb-7 pt-1 backdrop-blur-md lg:hidden">
          {links.map((link, i) => {
            const actief = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${i * 45}ms` }}
                className={`menu-item flex items-center justify-between border-b border-lijn/50 py-4 text-lg transition-colors duration-200 ${
                  actief ? "text-tekst" : "text-tekst-secundair hover:text-tekst"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                      actief ? "bg-accent" : "bg-transparent"
                    }`}
                  />
                  {link.label}
                </span>
                <span
                  aria-hidden
                  className="text-tekst-secundair/40 transition-transform duration-200"
                >
                  →
                </span>
              </Link>
            );
          })}
          <div
            className="menu-item flex flex-col gap-3 pt-6"
            style={{ animationDelay: `${links.length * 45}ms` }}
          >
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
