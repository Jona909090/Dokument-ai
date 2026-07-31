# Dokument AI

Profesionalna SaaS aplikacija za pripremu poslovnih i osobnih dokumenata, izgrađena s Next.js App Routerom.

Projekt sadrži javnu početnu stranicu, lokalni generator i izvoz dokumenata te Supabase autentikaciju i privatni korisnički dashboard.

## Funkcionalnosti

- registracija, prijava, potvrda emaila, reset lozinke i profil korisnika
- deset vrsta dokumenata s profesionalnim A4 pregledom
- lokalni PDF i Word (`.docx`) izvoz s Unicode podrškom
- privatno spremanje, ponovno otvaranje, uređivanje i brisanje dokumenata
- pretraga i sortiranje dokumenata po datumu i tipu
- premium dashboard sa statistikom, omiljenim i najčešće korištenim dokumentima
- trostupčani editor s live A4 pregledom, lokalnim autosaveom i undo/redo poviješću
- Command Palette (`Ctrl/Cmd + K`), globalna pretraga, obavijesti i tipkovnički prečaci
- svijetla i tamna tema, skeleton/loading stanja te responsive SaaS navigacija
- lokalni Smart Document Wizard s parserom ključnih riječi, quick templates grupama, pitanjima korak po korak, progress barom i smart validacijom
- privacy-first analitička infrastruktura s centralnim `trackEvent` servisom, lokalnim adapterom i demo administratorskim dashboardom na `/analytics`
- PostgreSQL Row Level Security: svaki korisnik pristupa isključivo svojim podacima

## Tehnologije

- Next.js App Router, React i TypeScript
- Tailwind CSS, shadcn/ui i Lucide Icons
- Supabase Auth, PostgreSQL i `@supabase/ssr`
- pdfmake i docx
- ESLint i npm

## Lokalno pokretanje

Potrebni su Node.js 20.9 ili noviji i npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Aplikacija će biti dostupna na [http://localhost:3000](http://localhost:3000). Na macOS-u ili Linuxu umjesto `copy` koristite `cp`.

## Supabase postavljanje

1. Kreirajte Supabase projekt.
2. Kopirajte `.env.example` u `.env.local` i unesite Project URL i Publishable key.
3. U Supabase SQL Editoru redom izvršite migracije iz `supabase/migrations/` ili ih primijenite Supabase CLI naredbom `supabase db push`.
4. U Authentication > URL Configuration postavite Site URL te dopustite `http://localhost:3000/auth/callback` i odgovarajući produkcijski URL.
5. Za produkcijsku potvrdu emaila i reset lozinke konfigurirajte SMTP u Supabase projektu.

Migracija stvara tablice `profiles` i `documents`, indekse, `updated_at` triggere, profil pri registraciji te RLS pravila za privatne podatke korisnika. Service-role ključ nije potreban niti se smije izlagati klijentu.

## Naredbe

```bash
npm run dev
npm run test
npm run lint
npm run build
npm run start
```

## Struktura

```text
src/
├── app/              # App Router, auth, dashboard i callback rute
├── components/
│   ├── auth/         # autentikacijski UI
│   ├── dashboard/    # navigacija i uređivanje dokumenata
│   ├── generator/    # obrasci, pregled i izvoz
│   ├── landing/      # sekcije početne stranice
│   ├── layout/       # header i footer
│   └── ui/           # shadcn/ui komponente
└── lib/              # zajedničke funkcije i Supabase klijenti
supabase/migrations/  # PostgreSQL migracije i RLS pravila
```

Stripe i OpenAI nisu implementirani u ovoj fazi. Projekt je spreman za deployment na Vercel nakon unosa varijabli okruženja i produkcijskih Auth URL-ova.

## Lokalna AI arhitektura

Ruta `/wizard` ne koristi OpenAI, Supabase ni Stripe. `src/lib/wizard.ts` sadrži deklarativna pitanja i pretvaranje odgovora u zajednički format dokumenta, dok `src/lib/document-types.ts` lokalno prepoznaje vrstu dokumenta pomoću ključnih riječi. Buduća AI integracija može zamijeniti parser ili predlaganje odgovora bez promjene wizard UI-ja i sustava izvoza.

## Analitika korištenja

`src/lib/analytics/` sadrži strogo tipizirane događaje, centralni servis, zamjenjivi adapter, demo podatke i izračun metrika. Lokalni adapter sprema najviše 1000 privacy-safe događaja u `localStorage`; ne koristi cookies niti šalje podatke vanjskim servisima. Promptovi, odgovori, sadržaj dokumenta, imena, adrese, iznosi, porezni brojevi i email adrese nisu dio Analytics API-ja. Buduća, trenutno neaktivna SQL shema nalazi se u `supabase/schema/analytics_events.sql`.
