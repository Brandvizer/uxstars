import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import { verhalen } from "@/lib/mock-data";

export function generateStaticParams() {
  return verhalen.map((verhaal) => ({ slug: verhaal.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const verhaal = verhalen.find((v) => v.slug === slug);
  if (!verhaal) return {};
  return { title: verhaal.titel, description: verhaal.ondertitel };
}

export default async function VerhaalPagina({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const verhaal = verhalen.find((v) => v.slug === slug);
  if (!verhaal) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent">
        {verhaal.rol} · {verhaal.ster}
      </p>
      <h1 className="mt-4 !text-[clamp(1.75rem,3vw+1rem,3rem)]">
        {verhaal.titel}
      </h1>
      <p className="mt-4 text-xl text-tekst-secundair">{verhaal.ondertitel}</p>

      <blockquote className="mt-10 rounded-2xl border border-accent/30 bg-paneel p-8">
        <p className="text-xl">&ldquo;{verhaal.quote}&rdquo;</p>
        <footer className="mt-4 text-sm text-tekst-secundair">
          — {verhaal.ster}, {verhaal.rol}
        </footer>
      </blockquote>

      <div className="mt-10 space-y-5">
        {verhaal.alineas.map((alinea) => (
          <p key={alinea.slice(0, 32)} className="text-tekst-secundair">
            {alinea}
          </p>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-lijn bg-paneel p-8 text-center">
        <h3>Zoek je een ster voor zo&rsquo;n missie?</h3>
        <div className="mt-6">
          <Button href="/missie-plaatsen">Plaats een missie</Button>
        </div>
      </div>
    </article>
  );
}
