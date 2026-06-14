"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getAdminStatus } from "@/lib/admin";

export async function uitloggen() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

/**
 * Keurt een missie goed: status in_review → open (publiek zichtbaar).
 * Dubbele beveiliging: controleert de admin-status server-side; de RLS
 * dwingt het daarnaast af.
 */
export async function keurMissieGoed(id: string) {
  const { isAdmin } = await getAdminStatus();
  if (!isAdmin) return;

  const supabase = await getSupabaseServer();
  if (!supabase) return;

  await supabase
    .from("missies")
    .update({ status: "open" })
    .eq("id", id)
    .eq("status", "in_review");

  // Ververs de admin-lijst én de publieke pagina's waar de missie nu opduikt.
  revalidatePath("/admin");
  revalidatePath("/missies");
  revalidatePath("/");
}
