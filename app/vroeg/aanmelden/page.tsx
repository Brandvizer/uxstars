import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import FoundingTeller from "@/components/marketing/FoundingTeller";
import VouchAanvraag from "@/components/auth/VouchAanvraag";
import { getFoundingStatus } from "@/lib/founding";

export const metadata: Metadata = {
  title: "Claim je founding-plek — UXSTARS",
  description:
    "Meld je aan als een van de eerste 100 sterren van UXSTARS. Portfolio, cv en een korte motivatie.",
};

export default async function FoundingAanmeldenPage() {
  const status = await getFoundingStatus();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
      <div className="flex justify-center">
        <Link href="/vroeg" aria-label="Terug naar UXSTARS">
          <Logo className="h-11 w-auto text-tekst sm:h-12" />
        </Link>
      </div>

      <div className="mx-auto mt-10 max-w-md">
        <FoundingTeller start={status} />
      </div>

      {status.open ? (
        <>
          <div className="mt-10 text-center">
            <h1 className="text-balance !text-[clamp(1.7rem,3vw+.8rem,2.6rem)]">
              Claim je founding-plek
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-tekst-secundair">
              Je hoort bij de eerste sterren van het stelsel. Laat je werk zien:
              portfolio, cv en een korte motivatie. We beoordelen elke aanmelding
              persoonlijk.
            </p>
          </div>

          <div className="mt-10">
            <VouchAanvraag />
          </div>
        </>
      ) : (
        <div className="mt-10 rounded-2xl border border-lijn bg-paneel p-8 text-center">
          <h1 className="!text-[clamp(1.6rem,3vw+.6rem,2.2rem)]">
            De 100 founding-plekken zijn vol
          </h1>
          <p className="mx-auto mt-4 max-w-md text-tekst-secundair">
            Het stelsel is voorlopig gevuld. Er komt een plek vrij wanneer een
            aanmelding afvalt. Houd onze socials in de gaten voor de volgende ronde.
          </p>
          <Link
            href="/vroeg"
            className="mt-6 inline-block text-accent transition-colors hover:text-accent-actief"
          >
            Terug naar de startpagina
          </Link>
        </div>
      )}
    </div>
  );
}
