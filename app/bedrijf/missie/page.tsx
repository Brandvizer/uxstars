import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getMijnBedrijf, membershipActief } from "@/lib/bedrijf-data";
import MissieForm from "@/components/missie/MissieForm";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Plaats een missie",
  robots: { index: false, follow: false },
};

export default async function BedrijfMissiePage() {
  const supabase = await getSupabaseServer();
  if (!supabase) redirect("/bedrijf/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/bedrijf/login");

  const bedrijf = await getMijnBedrijf();
  if (!bedrijf) redirect("/bedrijf/welkom");

  if (!membershipActief(bedrijf)) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 text-center sm:px-6">
        <h1 className="!text-[clamp(1.5rem,3vw+1rem,2rem)]">Membership nodig</h1>
        <p className="mt-3 text-tekst-secundair">
          Je hebt een actief membership nodig om een missie te plaatsen. Mail{" "}
          <a
            href="mailto:hallo@uxstars.nl?subject=Membership%20activeren"
            className="font-semibold text-accent hover:text-accent-actief"
          >
            hallo@uxstars.nl
          </a>{" "}
          om te activeren.
        </p>
        <div className="mt-6">
          <Button href="/bedrijf" variant="secundair">
            Terug naar je portaal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h1 className="!text-[clamp(2rem,4vw+0.5rem,3.5rem)]">Lanceer je missie</h1>
        <p className="mt-4 text-xl text-tekst-secundair">
          Zeven korte vragen. Binnen één werkdag hoor je welke sterren oplichten.
        </p>
      </div>
      <MissieForm
        alsBedrijf
        bedrijfNaam={bedrijf.naam}
        contactEmail={user.email ?? ""}
      />
    </div>
  );
}
