"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Onthult zijn inhoud rustig wanneer die in beeld scrollt (IntersectionObserver).
 * Eénmalig: blijft zichtbaar na de eerste keer. Respecteert prefers-reduced-motion
 * via de CSS in globals.css.
 */
export default function Onthul({
  children,
  className,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  /** Vertraging in ms, voor een lichte stagger tussen blokken */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [zichtbaar, setZichtbaar] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setZichtbaar(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`onthul-item ${zichtbaar ? "zichtbaar" : ""} ${className ?? ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
