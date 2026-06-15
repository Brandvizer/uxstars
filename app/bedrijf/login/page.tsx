import MagicLinkLogin from "@/components/auth/MagicLinkLogin";

// Ingang voor (nieuwe) bedrijven. Na inloggen ga je naar /bedrijf/welkom, waar
// je account wordt aangemaakt. Bestaande bedrijven kunnen ook gewoon via het
// gedeelde inlogscherm — de callback brengt ze naar /bedrijf.
export default function BedrijfLogin() {
  return (
    <MagicLinkLogin
      titel="Plaats je missie bij UXSTARS"
      intro="Log in of maak een bedrijfsaccount met je e-mailadres. Je krijgt een veilige inloglink."
      next="/bedrijf/welkom"
    />
  );
}
