"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export default function Modal({
  open,
  onClose,
  titel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titel: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-lijn bg-paneel p-0 text-tekst backdrop:bg-achtergrond/80 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h3>{titel}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-tekst-secundair transition-colors duration-200 hover:text-tekst"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 stroke-current"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-4 text-tekst-secundair">{children}</div>
      </div>
    </dialog>
  );
}
