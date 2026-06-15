import BootstrapInvite from "@/components/admin/BootstrapInvite";

export default function UitnodigingenTab() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold">Uitnodigingen</h2>
      <p className="mt-3 text-tekst-secundair">
        Maak een uitnodiging aan voor een van de eerste designers. Wie de link
        gebruikt, wordt direct een actieve ster — en krijgt zélf één vouch om
        door te geven. Zo groeit het stelsel verder vanzelf.
      </p>
      <div className="mt-6">
        <BootstrapInvite />
      </div>
    </div>
  );
}
