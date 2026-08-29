import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";
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
  let code: string | null = null;
  let bedoeldVoor: string | null = null;

  const db = getSupabase();
  if (db) {
    const { data } = await db.rpc("uitnodiging_info", { p_token: token });
    const info = data as {
      geldig: boolean;
      uitnodiger: string | null;
      code: string | null;
      bedoeld_voor: string | null;
    } | null;
    geldig = info?.geldig ?? false;
    uitnodiger = info?.uitnodiger ?? null;
    code = info?.code ?? null;
    bedoeldVoor = info?.bedoeld_voor ?? null;
  }

  // Ben je al ingelogd als iemand met toegang (ster/admin/bedrijf)? Dan mag je
  // deze vouch niet met dat account claimen — voorkomt sessie-verwarring.
  let ingelogdAls: string | null = null;
  const server = await getSupabaseServer();
  if (server) {
    const {
      data: { user },
    } = await server.auth.getUser();
    if (user?.email) {
      const [{ data: prof }, { data: adminRij }, { data: bedr }] =
        await Promise.all([
          server.rpc("mijn_profiel"),
          server
            .from("admins")
            .select("email")
            .eq("email", user.email)
            .maybeSingle(),
          server.rpc("mijn_bedrijf"),
        ]);
      const heeftStar = (prof?.length ?? 0) > 0;
      const heeftBedrijf = ((bedr as unknown[] | null)?.length ?? 0) > 0;
      if (heeftStar || adminRij || heeftBedrijf) ingelogdAls = user.email;
    }
  }

  return (
    <UitnodigingWelkom
      token={token}
      geldig={geldig}
      uitnodiger={uitnodiger}
      code={code}
      bedoeldVoor={bedoeldVoor}
      ingelogdAls={ingelogdAls}
    />
  );
}
