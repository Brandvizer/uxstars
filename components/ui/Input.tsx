"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const veldKlassen =
  "w-full rounded-xl border border-lijn bg-paneel px-4 py-3 text-base text-tekst placeholder:text-tekst-secundair/60 transition-colors duration-200 focus:border-accent focus:outline-none";

type InputProps = {
  label: string;
  fout?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, fout, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-base font-semibold">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={veldKlassen}
        aria-invalid={Boolean(fout)}
        {...rest}
      />
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
