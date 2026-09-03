# UXSTARS 2.0 · projectcontext

Korte context voor iedereen (mens of AI) die aan deze repo werkt. Lees dit eerst.

## Wat het is

De nieuwe uxstars.nl ("The Constellation"): besloten netwerk van gevouchte
**digital designers** (UX, UI, product, service, visual). Elke designer een ster,
elke opdracht een missie. Merknaam blijft UXSTARS; in copy schrijven we
"digital designers", nooit "UX-designers".

Stack: Next.js 15 App Router, TypeScript, Tailwind v4, Supabase (data + auth,
RLS aan), Resend (mail), Stripe (memberships), Vercel. Repo:
github.com/Brandvizer/uxstars. Push naar `main` = productie-deploy.

## Lokaal werken

```
git clone https://github.com/Brandvizer/uxstars.git && cd uxstars
npm install
npx vercel link                      # kies bestaand project "uxstars"
npx vercel env pull .env.local       # haalt de Development-omgeving op
npm run dev                          # http://localhost:3000
```

- Production/Preview-keys in Vercel zijn **Sensitive** en niet pull-baar. Voor
  lokaal staan Supabase, Resend en Stripe-**test**keys als *Config* op de
  omgeving **Development**. Nieuwe key nodig? Daar toevoegen, dan opnieuw pullen.
- Stripe lokaal: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  en de getoonde `whsec_…` handmatig als `STRIPE_WEBHOOK_SECRET` in `.env.local`.
- Migraties staan in `supabase/migrations/`, één bestand per wijziging, oplopend
  genummerd. Toepassen via de Supabase SQL Editor (inhoud plakken en runnen)
  of `supabase db push`. Een migratie die niet is toegepast, breekt stil: de
  code valt terug op mockdata of blijft op "laden…" staan.
- Admin: `/admin/login` (magic link). Je e-mailadres moet in de tabel `admins`
  staan en `http://localhost:3000/**` in Supabase → Auth → Redirect URLs.
- Homepage `/` redirect tijdelijk naar `/vroeg` (teaser-fase, founding-100).

## Ontwerpregels (afgesproken, niet onderhandelbaar)

- **Geen gedachtestreepjes** in tekst. Gebruik punt, dubbele punt of komma.
- **Geen iconen in knoppen** (geen pijlen, sterretjes, vinkjes). Ook niet in
  statusteksten, badges of mailonderwerpen.
- **Typografieschaal** staat in `app/globals.css`. Koppen krijgen hun maat van
  het element (h1 paginakop, h2 sectie, h3 kaart, h4 klein). `.kop-hero`,
  `.kop-1` t/m `.kop-4` geven een ander element die maat zonder de semantiek te
  veranderen (bijv. `<h1 class="kop-2">` op een accountpagina). Verder:
  `.tekst-intro` (18px), body 16px, `.tekst-klein` (14px, meta), `.label`
  (12px kapitalen, categorielabel boven een kop). Geen losse `text-xl`,
  `!text-[clamp(…)]` of eigen tracking op koppen en labels.
- **Invoervelden** via `components/ui/Input` (+ `Textarea`). Iconen links in het
  veld komen automatisch bij `type="email" | "url" | "tel"`; expliciet met
  `icoon="persoon" | "gebouw"`; `icoon={null}` zet uit. Geen iconen op vrije
  tekstvelden. `labelVerborgen` als de placeholder het visuele werk doet.
- **Placeholders**: naam "Voor- en achternaam"; eigen e-mail "jij@voorbeeld.nl";
  e-mail van een ander "naam@voorbeeld.nl"; bedrijfsnaam "Naam van het
  bedrijf"; website "https://jouwbedrijf.nl"; portfolio
  "https://jouwportfolio.nl"; LinkedIn "https://linkedin.com/in/…";
  telefoon "06 12345678". Vrije tekst begint met "Bijv. …" of is een vraag.
- **Knoppen** via `components/ui/Button`: `primair` (goud), `secundair`
  (paneel met rand), `ghost` (transparant met rand, voor "Vorige",
  "Kopieer de link"). Nooit een losse tekstlink als secundaire actie naast een
  primaire knop.
- **Selects** hebben een eigen chevron (globals.css), geen OS-pijl.
- **Container** is `max-w-7xl` (1280px), site en admin. Leeskolommen: tekst
  `max-w-3xl`, formulieren `max-w-md`, losse pagina's `max-w-2xl`.
- **Sterrenveld** (`components/constellation`): op de homepage vol met
  gezichten; als achtergrond van een pagina met formulier `rustig` (minder
  sterren, geen foto's, zachte lijnen) plus een donkere radiale kern achter de
  tekstkolom. `gezichtenOpMobiel={false}` voor alleen stipjes onder 640px.
- **Voortgang in meerstaps-formulieren**: altijd `RaketVoortgang`.
- **AI in formulieren**: één knop, één voorstel, nooit stil overschrijven; altijd een "Terug naar mijn tekst". Prompt bevat de toonregels (geen streepjes, "digital designers"). Route heeft een limiet per IP.
- **Admin-tabs** zijn gegroepeerd: Dashboard · Designers (Aanmeldingen,
  Uitnodigingen, Reacties, Accounts) · Opdrachtgevers (Missies in review,
  Bedrijven, Leads, Wachtlijst) · Deals (Plaatsingen).
- **Paginatitels**: alleen de paginanaam in `metadata.title`; de layout plakt
  er zelf " | UXSTARS" achter.

## Productlogica die makkelijk misgaat

- Founding-teller (`founding_status`) telt aanmeldingen die niet zijn
  afgewezen; sterren uit de seed tellen niet mee. Cap 100 zit ook in
  `dien_aanmelding_in`.
- Aanmelden met een e-mailadres dat al een ster-account heeft wordt in de
  database geweigerd (migratie 43); het formulier toont dan een nette melding.
- Wachtlijst is alleen voor **opdrachtgevers** (pre-launch leads). Designers
  gaan direct naar de founding-aanmelding.
- Elke ster heeft precies één vouch om weg te geven; op de accountpagina is dat
  het "gouden ticket".

## Logboek

**3 sep 2026** · MacBook-setup, Vercel Development-omgeving, Stripe testmodus,
migraties 42 (founding-cap) en 43 (e-mailcheck) toegepast. Copy naar "digital
designers", alle streepjes en knop-iconen weg, typografieschaal ingevoerd,
Input met iconen en uniforme placeholders, ghost-knop, eigen select-chevron,
container 1280, /vroeg rustiger (sterrenveld in achtergrondmodus, teller als
"Founding-plekken vrij 95 / 100"), aanmeldpagina met kopbalk en raketvoortgang,
vouch-kaart als gouden ticket, admin-tabs gegroepeerd, logorij op /vroeg, AI-opschoonknop voor missie-omschrijving (`/api/missie/opschonen`, key `ANTHROPIC_API_KEY`).

**Volgende stap (parkeer)**: inspreken van de missie-omschrijving via de Web Speech API, pas als het formulier op mobiel gebruikt wordt.
