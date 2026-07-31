# Dokument AI

Profesionalna početna osnova za SaaS aplikaciju izgrađenu s Next.js App Routerom.

Projekt trenutačno sadrži samo tehničku osnovu. AI funkcionalnosti, autentikacija, baza podataka, naplata i dashboard namjerno još nisu implementirani.

## Tehnologije

- Next.js (App Router)
- React i TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- ESLint
- npm

## Lokalno pokretanje

Potrebni su Node.js 20.9 ili noviji i npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Aplikacija će biti dostupna na [http://localhost:3000](http://localhost:3000).

Na macOS-u ili Linuxu umjesto `copy` koristite:

```bash
cp .env.example .env.local
```

## Dostupne naredbe

```bash
npm run dev       # razvojni server
npm run build     # produkcijski build
npm run start     # pokretanje produkcijskog builda
npm run lint      # ESLint provjera
```

## Struktura

```text
src/
├── app/              # App Router, globalni stilovi i metadata
├── components/
│   └── ui/           # shadcn/ui komponente
└── lib/              # zajedničke pomoćne funkcije
public/               # statičke datoteke
```

## Varijable okruženja

Datoteka `.env.example` dokumentira buduće varijable za Supabase, Stripe i OpenAI. Vrijednosti su namjerno prazne i nijedna usluga još nije povezana. Kopirajte datoteku u `.env.local` samo kada su lokalne vrijednosti potrebne.

## Planirane integracije

Projekt je strukturiran tako da se u kasnijim fazama može povezati s GitHubom, Supabaseom, Stripeom, OpenAI API-jem i Vercelom. Ove integracije nisu dio trenutačne faze.
