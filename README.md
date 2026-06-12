# UXSTARS 2.0 — The Constellation

De nieuwe uxstars.nl: het netwerk als sterrenstelsel, elke designer een ster, elke opdracht een missie.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4** — design tokens als CSS-variabelen in `app/globals.css` (`@theme`)
- **HTML canvas (2D)** voor het sterrenveld — geen WebGL in fase 1
- **React Hook Form + Zod** voor het missieformulier
- Fase 2: **Supabase** (data + auth), **Resend** (mail), hosting op **Vercel**

## Ontwikkelen

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # productiebuild
npm run lint
```

## Status: fase 2 (Supabase gekoppeld)

Het sterrenveld leest nu uit Supabase via een server component
(`components/constellation/SterrenVeld.tsx` → `lib/stars.ts`), met **terugval
op de mockdata** zolang Supabase niet is geconfigureerd of de database leeg is.
Zo werken `npm run dev` en `npm run build` ook zonder keys. Het missieformulier
toont nog de bevestiging zonder op te slaan (volgt in een latere fase).

## Supabase opzetten

1. Maak een project op [supabase.com](https://supabase.com) (gratis).
2. Kopieer `.env.example` naar `.env.local` en vul in (Project Settings → API):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (geheim).
3. Schema toepassen — kies één:
   - **SQL-editor**: plak `supabase/schema.sql` in Database → SQL Editor en run.
   - **CLI**: `supabase link --project-ref <ref>` en `supabase db push`
     (leest `supabase/migrations/`).
4. Vul met voorbeelddata: `npm run seed` (5 missies, 51 stars, vouches).

**Datamodel** — zes tabellen in `supabase/migrations/`: `opdrachtgevers`,
`stars`, `missies`, `reacties`, `vouches`, `plaatsingen`. Row Level Security
staat aan op alles; publiek leest alleen `missies` met status `open` en `stars`
met status `actief` (zonder e-mail/tarief, via kolomrechten). `vouches` zijn
publiek als id-paren voor de lijnen.

> Het schema is afgeleid uit de app (mockdata + missieformulier + briefing).
> Pas `supabase/migrations/` aan als je adviesdocument op details afwijkt.

## Structuur

- `app/` — pagina's (home, missies, missie-plaatsen, word-een-star, opdrachtgevers, verhalen, over-ons, admin)
- `components/constellation/` — StarField (canvas, client), SterrenVeld (server, fetcht), Star
- `components/missie/` — MissieKaart, MissieDetail, MissieForm (één stap per bestand), Bevestiging
- `components/ui/` — Button, Input, Badge, Modal
- `components/home/` — Hero, BelofteKaart, LogoRij, SplitsBlok
- `lib/` — supabase (client), stars (data + fallback), validaties (Zod), mock data
- `supabase/` — migrations (SQL per tabel), schema.sql (gecombineerd), seed.ts

## Designprincipes

- Donker stelsel (#0A0E1A), sterrengoud accent (#F5B941), één lettertype (Inter Tight, 400/600)
- Motion subtiel (200–400ms, ease-out); sterren twinkelen via opacity, nooit via beweging
- `prefers-reduced-motion` → statisch sterrenveld
