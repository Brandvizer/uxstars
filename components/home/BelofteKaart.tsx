import type { ReactNode } from "react";

export default function BelofteKaart({
  icoon,
  titel,
  tekst,
}: {
  icoon: ReactNode;
  titel: string;
  tekst: string;
}) {
  return (
    <div className="rounded-2xl border border-lijn bg-paneel p-6 transition-colors duration-300 ease-uit hover:border-accent/40">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
        {icoon}
      </div>
      <h3 className="mt-5">{titel}</h3>
      <p className="mt-2 text-base text-tekst-secundair">{tekst}</p>
    </div>
  );
}
