import MagicLinkLogin from "@/components/auth/MagicLinkLogin";

export default function AdminLogin() {
  return (
    <MagicLinkLogin
      titel="Missiecontrole"
      intro="Log in met je e-mailadres. Je krijgt een veilige inloglink toegestuurd. Alleen voor beheerders op de allowlist."
      next="/admin"
    />
  );
}
