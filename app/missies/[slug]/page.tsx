import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MissieDetail from "@/components/missie/MissieDetail";
import { missies } from "@/lib/mock-data";

export function generateStaticParams() {
  return missies.map((missie) => ({ slug: missie.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const missie = missies.find((m) => m.slug === slug);
  if (!missie) return {};
  return { title: missie.titel, description: missie.intro };
}

export default async function MissiePagina({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const missie = missies.find((m) => m.slug === slug);
  if (!missie) notFound();

  return <MissieDetail missie={missie} />;
}
