import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import UitnodigingWelkom from "@/components/auth/UitnodigingWelkom";

export const metadata: Metadata = {
  title: "Je bent uitgenodigd",
  robots: { index: false, follow: false },
};

export default async function UitnodigingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let geldig = false;
  let uitnodiger: string | null = null;

  const db = getSupabase();
  if (db) {
    const { data } = await db.rpc("uitnodiging_info", { p_token: token });
    const info = data as { geldig: boolean; uitnodiger: string | null } | null;
    geldig = info?.geldig ?? false;
    uitnodiger = info?.uitnodiger ?? null;
  }

  return (
    <UitnodigingWelkom token={token} geldig={geldig} uitnodiger={uitnodiger} />
  );
}
