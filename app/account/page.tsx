import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase-server";
import AccountForm from "@/components/account/AccountForm";
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

  const { data: uitnodiging } = await supabase.rpc("mijn_uitnodiging");

  return (
    <AccountForm
      profiel={profiel}
      uitnodiging={
        uitnodiging as { token: string; status: string } | null
      }
      email={user.email}
      userId={user.id}
    />
  );
}
