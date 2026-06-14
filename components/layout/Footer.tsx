import Link from "next/link";
import Logo from "@/components/ui/Logo";

const kolommen = [
  {
    titel: "Navigatie",
    links: [
      { href: "/missies", label: "Missies" },
      { href: "/opdrachtgevers", label: "Voor opdrachtgevers" },
      { href: "/word-een-star", label: "Word een star" },
      { href: "/verhalen", label: "Verhalen" },
      { href: "/over-ons", label: "Over ons" },
    ],
  },
  {
    titel: "Contact",
    links: [
      { href: "mailto:hallo@uxstars.nl", label: "hallo@uxstars.nl" },
      {
        href: "https://www.linkedin.com/company/uxstars",
        label: "LinkedIn",
      },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-lijn">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <Logo className="h-7 w-auto text-tekst" />
          <p className="mt-3 max-w-xs text-base text-tekst-secundair">
            Het sterrenstelsel van UX-talent. Elke designer een ster, elke
            opdracht een missie.
          </p>
        </div>

        {kolommen.map((kolom) => (
          <div key={kolom.titel}>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-tekst-secundair">
              {kolom.titel}
            </h4>
            <ul className="mt-4 space-y-2">
              {kolom.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-base text-tekst-secundair transition-colors duration-200 hover:text-tekst"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-lijn">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-tekst-secundair sm:px-6">
          © {new Date().getFullYear()} UXSTARS · Met zorg gebouwd onder een
          heldere sterrenhemel
        </p>
      </div>
    </footer>
  );
}
