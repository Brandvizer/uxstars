"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type MenuItem = { href: string; titel: string; tekst: string };
type Menu = { key: string; label: string; items: MenuItem[] };

const menus: Menu[] = [
  {
    key: "designers",
    label: "Voor designers",
    items: [
      { href: "/word-een-star", titel: "Word een star", tekst: "Kom binnen via een vouch." },
      { href: "/missies", titel: "Missies", tekst: "Vind opdrachten die bij je passen." },
      { href: "/leden", titel: "Het stelsel", tekst: "De gevouchte community." },
      { href: "/verhalen", titel: "Verhalen", tekst: "Ervaringen van sterren." },
    ],
  },
  {
    key: "opdrachtgevers",
    label: "Voor opdrachtgevers",
    items: [
      { href: "/opdrachtgevers", titel: "Zo werkt het", tekst: "Snel een gevouchte ster, zonder gedoe." },
      { href: "/missie-plaatsen", titel: "Plaats een missie", tekst: "Vertel ons wie je zoekt." },
      { href: "/bedrijf/login", titel: "Bedrijfsaccount", tekst: "Beheer je missies en membership." },
    ],
  },
];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [ingelogd, setIngelogd] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => setIngelogd(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => setIngelogd(!!session));
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

        <div className="hidden items-center gap-7 lg:flex">
          {menus.map((menu) => {
            const actief = menu.items.some((i) => pathname.startsWith(i.href));
            const isOpen = openMenu === menu.key;
            return (
              <div
                key={menu.key}
                className="relative"
                onMouseEnter={() => setOpenMenu(menu.key)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  type="button"
                  onClick={() => setOpenMenu(isOpen ? null : menu.key)}
                  aria-expanded={isOpen}
                  className={`flex items-center gap-1.5 text-base transition-colors duration-200 ${
                    actief || isOpen
                      ? "text-tekst"
                      : "text-tekst-secundair hover:text-tekst"
                  }`}
                >
                  {menu.label}
                  <Chevron open={isOpen} />
                </button>

                {isOpen && (
                  <div className="absolute left-0 top-full z-50 pt-3">
                    <div className="w-80 rounded-2xl border border-lijn bg-paneel p-2 shadow-2xl shadow-black/40">
                      {menu.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpenMenu(null)}
                          className="block rounded-xl px-4 py-3 transition-colors duration-150 hover:bg-achtergrond"
                        >
                          <span className="block font-semibold text-tekst">
                            {item.titel}
                          </span>
                          <span className="mt-0.5 block text-sm text-tekst-secundair">
                            {item.tekst}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="ml-1 flex items-center gap-3">
            {ingelogd !== null && (
              <Button href={accountHref} variant="secundair" size="sm">
                {accountLabel}
              </Button>
            )}
            <Button href="/missie-plaatsen" size="sm">
              Plaats een missie
            </Button>
          </div>
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
        <div className="menu-paneel border-t border-lijn bg-achtergrond/95 px-4 pb-7 pt-2 backdrop-blur-md lg:hidden">
          {menus.map((menu, gi) => (
            <div
              key={menu.key}
              className="menu-item border-b border-lijn/50 py-4"
              style={{ animationDelay: `${gi * 60}ms` }}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {menu.label}
              </p>
              <div>
                {menu.items.map((item) => {
                  const actief = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between py-2.5 text-lg transition-colors duration-200 ${
                        actief
                          ? "text-tekst"
                          : "text-tekst-secundair hover:text-tekst"
                      }`}
                    >
                      {item.titel}
                      <span aria-hidden className="text-tekst-secundair/40">
                        →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <div
            className="menu-item flex flex-col gap-3 pt-6"
            style={{ animationDelay: `${menus.length * 60}ms` }}
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
