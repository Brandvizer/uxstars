import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primair" | "secundair" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

const basis =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ease-uit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const varianten: Record<Variant, string> = {
  primair:
    "bg-accent text-achtergrond hover:bg-accent-actief hover:shadow-[0_0_24px_rgba(245,185,65,0.35)]",
  secundair:
    "border border-lijn bg-paneel text-tekst hover:border-tekst-secundair",
  ghost: "text-tekst-secundair hover:text-tekst",
};

const maten: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export default function Button({
  children,
  href,
  variant = "primair",
  size = "md",
  className = "",
  ...rest
}: Props) {
  const klassen = `${basis} ${varianten[variant]} ${maten[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={klassen} onClick={rest.onClick as never}>
        {children}
      </Link>
    );
  }

  return (
    <button className={klassen} {...rest}>
      {children}
    </button>
  );
}
