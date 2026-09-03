import Link from "next/link";
import Logo from "@/components/ui/Logo";

/**
 * Kopbalk voor losse pagina's zonder navigatie (/vroeg en de founding-
 * aanmelding): logo gecentreerd, zelfde hoogte en onderlijn als de site-nav.
 */
export default function LogoBalk({ href = "/vroeg" }: { href?: string }) {
  return (
    <header className="relative z-10 border-b border-lijn">
      <div className="flex h-16 items-center justify-center sm:h-20">
        <Link href={href} aria-label="UXSTARS">
          <Logo className="h-9 w-auto text-tekst sm:h-10" />
        </Link>
      </div>
    </header>
  );
}
