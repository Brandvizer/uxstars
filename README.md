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

## Status: fase 1

Statische site met mock data (`lib/mock-data.ts`). Het sterrenveld, alle pagina's en het 7-staps missieformulier werken; verzenden toont de bevestiging maar slaat nog niets op. In fase 2 vervangen `lib/supabase.ts` en het datamodel (tabellen `stars`, `missies`, `opdrachtgevers`, `reacties`, `vouches`, `plaatsingen`) de mock data — `components/constellation/useStarData.ts` is daarvoor het koppelpunt.

## Structuur

- `app/` — pagina's (home, missies, missie-plaatsen, word-een-star, opdrachtgevers, verhalen, over-ons, admin)
- `components/constellation/` — StarField (canvas), Star, useStarData
- `components/missie/` — MissieKaart, MissieDetail, MissieForm (één stap per bestand), Bevestiging
- `components/ui/` — Button, Input, Badge, Modal
- `components/home/` — Hero, BelofteKaart, LogoRij, SplitsBlok
- `lib/` — validaties (Zod), mock data

## Designprincipes

- Donker stelsel (#0A0E1A), sterrengoud accent (#F5B941), één lettertype (Inter Tight, 400/600)
- Motion subtiel (200–400ms, ease-out); sterren twinkelen via opacity, nooit via beweging
- `prefers-reduced-motion` → statisch sterrenveld
