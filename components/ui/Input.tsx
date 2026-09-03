"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const veldKlassen =
  "w-full rounded-xl border border-lijn bg-achtergrond px-4 py-3 text-base text-tekst placeholder:text-tekst-secundair/60 transition-colors duration-200 focus:border-accent focus:outline-none";

export type Icoon = "mail" | "persoon" | "link" | "telefoon" | "gebouw";

// Lijn-iconen (24x24, stroke). Klein en rustig, in de secundaire tekstkleur.
const ICONEN: Record<Icoon, React.ReactNode> = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </>
  ),
  persoon: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20.5c0-3.6 3.6-6 8-6s8 2.4 8 6" />
    </>
  ),
  link: (
    <>
      <path d="M10 13.5a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1.2 1.2" />
      <path d="M14 10.5a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1.2-1.2" />
    </>
  ),
  telefoon: (
    <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 006.5 6.5l1.5-2 4 1.5V19a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" />
  ),
  gebouw: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
    </>
  ),
};

/** Kiest automatisch een icoon op basis van het type, tenzij expliciet gezet. */
function icoonVoor(icoon: Icoon | null | undefined, type?: string): Icoon | null {
  if (icoon === null) return null;
  if (icoon) return icoon;
  if (type === "email") return "mail";
  if (type === "url") return "link";
  if (type === "tel") return "telefoon";
  return null;
}

type InputProps = {
  label: string;
  fout?: string;
  /** Icoon links in het veld; null onderdrukt het automatische icoon. */
  icoon?: Icoon | null;
} & InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, fout, id, icoon, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  const gekozen = icoonVoor(icoon, rest.type);
  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-base font-semibold">
        {label}
      </label>
      <div className="relative">
        {gekozen && (
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-tekst-secundair"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {ICONEN[gekozen]}
          </svg>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${veldKlassen} ${gekozen ? "pl-12" : ""}`}
          aria-invalid={Boolean(fout)}
          {...rest}
        />
      </div>
      {fout && <p className="mt-2 text-sm text-accent-actief">{fout}</p>}
    </div>
  );
});

type TextareaProps = {
  label: string;
  fout?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, fout, id, ...rest }, ref) {
    const inputId = id ?? rest.name;
    return (
      <div>
        <label htmlFor={inputId} className="mb-2 block text-base font-semibold">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          rows={5}
          className={veldKlassen}
          aria-invalid={Boolean(fout)}
          {...rest}
        />
        {fout && <p className="mt-2 text-sm text-accent-actief">{fout}</p>}
      </div>
    );
  },
);

export default Input;
