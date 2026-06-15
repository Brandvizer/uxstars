import MagicLinkLogin from "@/components/auth/MagicLinkLogin";

export default function StarLogin() {
  return (
    <MagicLinkLogin
      titel="Jouw plek in het stelsel"
      intro="Log in om je profiel, beschikbaarheid en vouch te beheren."
      next="/account"
    />
  );
}
