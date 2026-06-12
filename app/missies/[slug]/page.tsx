import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MissieDetail from "@/components/missie/MissieDetail";
import { getMissie, getMissies } from "@/lib/missies";

// Missies uit Supabase. dynamicParams (default) zorgt dat missies die ná de
// build worden toegevoegd alsnog renderen; revalidate houdt ze fris.
export const revalidate = 300;

export async function generateStaticParams() {
  const missies = await getMissies();
  return missies.map((missie) => ({ slug: missie.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const missie = await getMissie(slug);
  if (!missie) return {};
  return { title: missie.titel, description: missie.intro };
}

export default async function MissiePagina({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const missie = await getMissie(slug);
  if (!missie) notFound();

  return <MissieDetail missie={missie} />;
}
