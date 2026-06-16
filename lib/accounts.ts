import { getSupabaseService } from "./supabase";

export type Account = {
  id: string;
  email: string;
  rol: "admin" | "ster" | "bedrijf" | "leeg";
  naam: string | null;
  created_at: string;
};

/**
 * Alle aangemaakte auth-accounts met hun rol (admin / ster / bedrijf / leeg).
 * Gebruikt de service-role — alleen aanroepen vanuit de beveiligde admin-pagina.
 */
export async function getAccounts(): Promise<Account[]> {
  const svc = getSupabaseService();
  if (!svc) return [];

  const { data } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = data?.users ?? [];

  const [{ data: stars }, { data: bedrijven }, { data: admins }] =
    await Promise.all([
      svc.from("stars").select("user_id, naam").not("user_id", "is", null),
      svc
        .from("opdrachtgevers")
        .select("user_id, naam")
        .not("user_id", "is", null),
      svc.from("admins").select("email"),
    ]);

  const adminEmails = new Set((admins ?? []).map((a) => a.email));
  const starMap = new Map(
    (stars ?? []).map((s) => [s.user_id as string, s.naam as string]),
  );
  const bedrijfMap = new Map(
    (bedrijven ?? []).map((b) => [b.user_id as string, b.naam as string]),
  );

  return users
    .map((u): Account => {
      const email = u.email ?? "";
      if (email && adminEmails.has(email))
        return { id: u.id, email, rol: "admin", naam: null, created_at: u.created_at };
      if (starMap.has(u.id))
        return {
          id: u.id,
          email,
          rol: "ster",
          naam: starMap.get(u.id) ?? null,
          created_at: u.created_at,
        };
      if (bedrijfMap.has(u.id))
        return {
          id: u.id,
          email,
          rol: "bedrijf",
          naam: bedrijfMap.get(u.id) ?? null,
          created_at: u.created_at,
        };
      return { id: u.id, email, rol: "leeg", naam: null, created_at: u.created_at };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
