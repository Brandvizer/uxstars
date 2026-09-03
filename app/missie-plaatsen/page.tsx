import type { Metadata } from "next";
import MissieForm from "@/components/missie/MissieForm";

export const metadata: Metadata = {
  title: "Plaats een missie",
  description:
    "Vertel ons in zeven korte stappen welke designer je zoekt. Binnen één werkdag reactie.",
};

export default function MissiePlaatsenPagina() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h1>
          Lanceer je missie
        </h1>
        <p className="mt-4 text-tekst-secundair tekst-intro">
          Zeven korte vragen. Eén per scherm. Binnen één werkdag hoor je welke
          sterren oplichten.
        </p>
      </div>
      <MissieForm />
    </div>
  );
}
