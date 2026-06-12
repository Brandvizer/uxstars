import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPagina() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <h1 className="!text-[clamp(1.75rem,3vw+1rem,2.5rem)]">Missiecontrole</h1>
      <p className="mt-4 text-tekst-secundair">
        Het admin-dashboard komt in fase 2, samen met Supabase-auth. Hier
        beheer je straks missies (concept → in review → open) en
        ster-aanvragen.
      </p>
    </div>
  );
}
