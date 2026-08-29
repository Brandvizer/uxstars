import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase-server";
import AccountForm, { type Stelsel } from "@/components/account/AccountForm";
import { type Aanbeveling } from "@/components/account/BrengOpdrachtgever";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Mijn profiel",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await getSupabaseServer();
  if (!supabase) redirect("/account/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");

  const { data: profielen } = await supabase.rpc("mijn_profiel");
  const profiel = profielen?.[0];

  // Geen ster-profiel? Stuur door naar de juiste plek: admins naar de
  // missiecontrole, bedrijven naar het bedrijfsportaal. Zo kom je via "Mijn
  // account" altijd bij je eigen omgeving uit.
  if (!profiel && user.email) {
    const { data: adminRij } = await supabase
      .from("admins")
      .select("email")
      .eq("email", user.email)
      .maybeSingle();
    if (adminRij) redirect("/admin");

    const { data: bedrijven } = await supabase.rpc("mijn_bedrijf");
    if (bedrijven && bedrijven.length > 0) redirect("/bedrijf");
  }

  // Ingelogd, maar (nog) geen ster — je hebt een uitnodiging nodig.
  if (!profiel) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 text-center sm:px-6">
        <h1 className="!text-[clamp(1.5rem,3vw+1rem,2rem)]">Nog geen sterrenplek</h1>
        <p className="mt-3 text-tekst-secundair">
          Je bent ingelogd als <span className="text-tekst">{user.email}</span>,
          maar je hebt nog geen ster-profiel. UXSTARS is invite-only — je komt
          binnen via een vouch van een bestaand lid.
        </p>
        <div className="mt-6">
          <Button href="/">Terug naar het stelsel</Button>
        </div>
      </div>
    );
  }

  // Nog niet goedgekeurd? Toon een statusscherm i.p.v. het volledige account.
  if (profiel.status === "gevouched" || profiel.status === "aangevraagd") {
    return (
      <div className="relative mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
        />
        <svg
          viewBox="0 0 24 24"
          className="zweef relative h-16 w-16 fill-accent"
          aria-hidden="true"
        >
          <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
        </svg>
        <p className="relative mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-accent">
          Aanmelding in behandeling
        </p>
        <h1 className="relative mt-3 !text-[clamp(1.5rem,3vw+1rem,2.25rem)]">
          We bekijken je aanmelding
        </h1>
        <p className="relative mt-4 text-tekst-secundair">
          Hoi {profiel.naam.split(" ")[0]}, je vouch is binnen. Ons team
          beoordeelt &apos;m kort — een menselijke check hoort bij een gevoucht
          netwerk. Je krijgt bericht op{" "}
          <span className="text-tekst">{user.email}</span>.
        </p>
        <div className="relative mt-8">
          <Button href="/" variant="secundair">
            Terug naar het stelsel
          </Button>
        </div>
      </div>
    );
  }

  if (profiel.status === "afgewezen") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center sm:px-6">
        <h1 className="!text-[clamp(1.5rem,3vw+1rem,2.25rem)]">
          Deze keer geen plek
        </h1>
        <p className="mt-4 text-tekst-secundair">
          Hoi {profiel.naam.split(" ")[0]}, we hebben je aanmelding bekeken en
          kunnen je nu nog geen plek in het stelsel geven. Je ontving een mail met
          onze toelichting. Je bent van harte welkom om het later opnieuw te
          proberen.
        </p>
        <div className="mt-8">
          <Button href="/" variant="secundair">
            Terug naar het stelsel
          </Button>
        </div>
      </div>
    );
  }

  const { data: uitnodiging } = await supabase.rpc("mijn_uitnodiging");
  const { data: stelsel } = await supabase.rpc("mijn_stelsel");
  const { data: aanbevelingen } = await supabase.rpc("mijn_aanbevelingen");

  return (
    <AccountForm
      profiel={profiel}
      uitnodiging={
        uitnodiging as {
          token: string;
          code?: string | null;
          status: string;
        } | null
      }
      stelsel={stelsel as Stelsel | null}
      aanbevelingen={(aanbevelingen as Aanbeveling[] | null) ?? []}
      email={user.email}
      userId={user.id}
    />
  );
}
