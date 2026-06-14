import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAdminStatus } from "@/lib/admin";
import { uitloggen } from "./actions";
import Tabs from "./Tabs";

export const metadata: Metadata = {
  title: "Missiecontrole",
  robots: { index: false, follow: false },
};

export default async function BeveiligdeAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await getAdminStatus();

  // Geen sessie → naar login (middleware vangt dit meestal al af).
  if (!user) redirect("/admin/login");

  // Ingelogd maar niet op de allowlist → geen toegang.
  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 text-center sm:px-6">
        <h1 className="!text-[clamp(1.5rem,3vw+1rem,2rem)]">Geen toegang</h1>
        <p className="mt-3 text-tekst-secundair">
          Je bent ingelogd als{" "}
          <span className="text-tekst">{user.email}</span>, maar dit adres staat
          niet op de beheerders-allowlist.
        </p>
        <form action={uitloggen} className="mt-6">
          <button
            type="submit"
            className="text-accent transition-colors duration-200 hover:text-accent-actief"
          >
            Uitloggen
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-lijn">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <p className="flex items-center gap-2 font-semibold">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-accent" aria-hidden="true">
              <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
            </svg>
            Missiecontrole
          </p>
          <div className="flex items-center gap-4 text-sm text-tekst-secundair">
            <span className="hidden sm:inline">{user.email}</span>
            <form action={uitloggen}>
              <button
                type="submit"
                className="transition-colors duration-200 hover:text-tekst"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <Tabs />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
