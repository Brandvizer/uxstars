import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getMijnBedrijf, membershipActief } from "@/lib/bedrijf-data";
import BedrijfForm from "@/components/bedrijf/BedrijfForm";

export const metadata: Metadata = {
  title: "Mijn bedrijf",
  robots: { index: false, follow: false },
};

export default async function BedrijfPage() {
  const supabase = await getSupabaseServer();
  if (!supabase) redirect("/bedrijf/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/bedrijf/login");

  const bedrijf = await getMijnBedrijf();
  if (!bedrijf) redirect("/bedrijf/welkom");

  return (
    <BedrijfForm
      bedrijf={bedrijf}
      email={user.email}
      actief={membershipActief(bedrijf)}
    />
  );
}
