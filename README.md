# Dokument AI

Dokument AI je Next.js SaaS sučelje za izradu, pregled, lokalno spremanje i izvoz poslovnih i osobnih dokumenata. Trenutačna razvojna faza radi potpuno lokalno i ne zahtijeva korisnički račun ni vanjski backend.

## Trenutačne funkcionalnosti

- lokalna demo sesija s izmišljenim korisnikom
- dashboard sa statistikom, nedavnim i najčešće korištenim dokumentima
- pet početnih demo dokumenata
- popis dokumenata s pretragom, filtrima i sortiranjem
- otvaranje, uređivanje, dupliciranje, arhiviranje i brisanje
- lokalni autosave s prikazom stanja spremanja
- PDF i Word (`.docx`) izvoz
- profil firme s logotipom, potpisom i pečatom
- lokalni adresar kontakata i automatsko popunjavanje podataka dokumenta
- Smart Document Wizard i profesionalni A4 pregled uživo
- privacy-first lokalna analitika bez sadržaja dokumenata
- svijetla i tamna tema te responsive korisničko sučelje

## Lokalna arhitektura podataka

Domenski modeli nalaze se u `src/lib/data/models.ts`, a sva spremanja prolaze kroz strogo tipizirana repository sučelja iz `src/lib/data/repositories.ts`. Aktivni adapter definiran je u `src/lib/data/config.ts` i trenutačno koristi centralni lokalni adapter nad `localStorage` spremištem.

UI komponente ne pristupaju izravno spremištu dokumenata. Zbog toga će se lokalni adapter kasnije moći zamijeniti Supabase adapterom bez promjene dashboarda, popisa dokumenata, editora, firme ili kontakata.

Podaci ove demo faze postoje samo u trenutačnom pregledniku i nisu prikladni za produkcijsko spremanje osjetljivih podataka. Opcija **Obriši demo podatke** na dashboardu uklanja lokalnog korisnika, firmu, kontakte i dokumente.

## Budući Supabase prijelaz

Supabase nije aktivno povezan u ovoj fazi. Budući adapter treba implementirati postojeća repository sučelja i zatim zamijeniti `activeDataAdapter` konfiguraciju. Neaktivna referentna PostgreSQL shema nalazi se u `supabase/schema/saas_data_model.sql` i sadrži tablice:

- `profiles`
- `companies`
- `contacts`
- `documents`
- `document_items`
- `document_exports`

Shema uključuje primarne i vanjske ključeve, vremenske oznake, indekse i nacrt RLS pravila. Datoteka nije migracija i ne izvršava se automatski.

Za buduću produkcijsku integraciju bit će potrebne najmanje ove varijable:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

U ovoj lokalnoj fazi nisu potrebne varijable okruženja. OpenAI, Stripe i ostali vanjski servisi nisu povezani.

## Lokalno pokretanje

Potrebni su Node.js 20.9 ili noviji i npm.

```bash
npm install
npm run dev
```

Aplikacija je dostupna na [http://localhost:3000](http://localhost:3000).

## Provjere

```bash
npm run test
npm run lint
npm run build
```

## Glavne rute

- `/dashboard` — lokalni SaaS pregled
- `/documents` — upravljanje dokumentima
- `/documents/[id]` — uređivanje i autosave
- `/company` — podaci firme
- `/contacts` — adresar klijenata
- `/wizard` — vođena izrada dokumenta
- `/analytics` — lokalni demo analytics dashboard

## Tehnologije

Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, pdfmake, docx, Vitest, ESLint i npm.
