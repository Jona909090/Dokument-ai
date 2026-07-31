# Dokument AI

Profesionalna SaaS aplikacija za pripremu poslovnih i osobnih dokumenata, izgrađena s Next.js App Routerom.

Projekt trenutačno sadrži javnu početnu stranicu i lokalnu prvu verziju generatora obrazaca. AI funkcionalnosti, autentikacija, baza podataka, naplata, trajno spremanje i izvoz još nisu implementirani.

## Generator dokumenata

Unos na početnoj stranici lokalno prepoznaje deset kategorija: CV, fakturu, ponudu, ugovor, zahtjev ili molbu, otkaz, narudžbenicu, zapisnik, potvrdu i poslovno pismo.

Faktura i ponuda podržavaju proizvoljan broj stavki, količine i cijene te automatski izračun osnovice, PDV-a i ukupnog iznosa. Podaci uneseni u obrasce trenutačno se ne šalju na poslužitelj niti se trajno spremaju.

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
│   ├── generator/    # obrasci i logika generatora
│   ├── landing/      # sekcije početne stranice
│   ├── layout/       # header i footer
│   └── ui/           # shadcn/ui komponente
└── lib/              # zajedničke pomoćne funkcije
public/               # statičke datoteke
```

## Varijable okruženja

Datoteka `.env.example` dokumentira buduće varijable za Supabase, Stripe i OpenAI. Vrijednosti su namjerno prazne i nijedna usluga još nije povezana. Kopirajte datoteku u `.env.local` samo kada su lokalne vrijednosti potrebne.

## Planirane integracije

Projekt je strukturiran tako da se u kasnijim fazama može povezati s GitHubom, Supabaseom, Stripeom, OpenAI API-jem i Vercelom. Ove integracije nisu dio trenutačne faze.
