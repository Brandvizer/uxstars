import { redirect } from "next/navigation";

// Eén inlogscherm voor iedereen. Oude /admin/login-links sturen we door naar
// het gedeelde scherm; de auth-callback brengt admins daarna naar /admin.
export default function AdminLogin() {
  redirect("/account/login");
}
