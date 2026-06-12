import type { ReactNode } from "react";

type Kleur = "neutraal" | "accent" | "succes";

const kleuren: Record<Kleur, string> = {
  neutraal: "border-lijn text-tekst-secundair",
  accent: "border-accent/40 text-accent",
  succes: "border-succes/40 text-succes",
};

export default function Badge({
  children,
  kleur = "neutraal",
}: {
  children: ReactNode;
  kleur?: Kleur;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${kleuren[kleur]}`}
    >
      {children}
    </span>
  );
}
