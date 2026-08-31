import BootstrapInvite from "@/components/admin/BootstrapInvite";

export default function UitnodigingenTab() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold">Nodig iemand direct uit</h2>
      <p className="mt-2 text-tekst-secundair">
        Maak een eenmalige vouch-link om zelf iemand binnen te halen. Zij krassen
        &apos;m open en doorlopen de aanmelding — die je daarna beoordeelt bij{" "}
        <span className="text-tekst">Aanmeldingen</span>. Alle beoordeling gebeurt
        daar; hier maak je alleen de link.
      </p>
      <div className="mt-6">
        <BootstrapInvite />
      </div>
    </div>
  );
}
