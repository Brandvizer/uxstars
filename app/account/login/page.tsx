import MagicLinkLogin from "@/components/auth/MagicLinkLogin";

export default function StarLogin() {
  return (
    <MagicLinkLogin
      titel="Welkom terug"
      intro="Log in met je e-mailadres — je krijgt een veilige inloglink. We brengen je vanzelf naar de juiste plek."
      next="/account"
    />
  );
}
