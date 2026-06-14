"use server";

import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function uitloggen() {
  const supabase = await getSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}
