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

## Supabase produkcijska konfiguracija

Lokalni adapter ostaje demo fallback. Produkcijska infrastruktura koristi verzionirane migracije u `supabase/migrations`, Supabase Auth, multi-tenant PostgreSQL s RLS politikama te privatni Storage bucket.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Koristite publishable key gdje je dostupan; anon key je kompatibilni fallback. Service-role ključ je isključivo serverska tajna i nikada ne smije imati `NEXT_PUBLIC_` prefiks.

Lokalni razvoj zahtijeva Docker-compatible runtime i Supabase CLI:

```bash
npx supabase start
npx supabase db reset
```

Za povezivanje s udaljenim projektom:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

U Supabase Auth postavite Site URL i dopustite `${NEXT_PUBLIC_APP_URL}/auth/callback`. Bucket `private-documents` je privatan; putanje počinju s `organization-id/` i zaštićene su Storage RLS politikama.

Na Vercelu dodajte varijable zasebno za Production, Preview i Development. Nakon deploymenta postavite `NEXT_PUBLIC_APP_URL` na kanonsku HTTPS domenu. Bez Supabase varijabli aplikacija nastavlja raditi u lokalnom demo načinu.

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

## AI Document Copilot

Copilot je centraliziran server-side sloj. UI poziva samo `/api/ai/generate`; OpenAI API ključ nikada nije dio browser bundlea. Bez ključa aplikacija automatski koristi jasno označen lokalni mock provider i build nastavlja raditi.

### Konfiguracija

Kreirajte API ključ u OpenAI Platform postavkama i spremite ga samo u lokalni `.env.local` ili Vercel server-side environment varijable:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-terra
OPENAI_FALLBACK_MODEL=gpt-5.6-luna
AI_PROVIDER=openai
AI_ENABLED=true
AI_TIMEOUT_MS=45000
```

Za testiranje bez stvarne potrošnje koristite `AI_PROVIDER=mock` i ostavite ključ praznim. Za potpuno isključivanje koristite `AI_ENABLED=false`. Ključ nikada ne smije imati prefiks `NEXT_PUBLIC_`.

### Arhitektura i sigurnost

- `src/lib/ai/provider.ts` definira provider ugovor.
- `mock-provider.ts` daje determinističku lokalnu klasifikaciju, ekstrakciju i simulacije grešaka.
- `openai-provider.ts` koristi Responses API, Moderation API i strogi Structured Output.
- `service.ts` centralizira timeout, idempotency, izbor providera, sigurnost i kredite.
- `schemas.ts` je registry struktura koje smiju ući u aplikacijske modele.
- `operations.ts` sadrži diff, selektivnu primjenu, Undo, validaciju i konverziju kopije.

Nova vrsta dokumenta prvo se dodaje u postojeći dokumentni model i wizard, zatim u schema registry i mock klasifikaciju. Nova AI akcija dodaje se u `aiActions`, kreditni cjenik i provider implementacije. Strukturirani rezultat mora proći Zod/JSON Schema provjeru prije prikaza ili spremanja.

AI ne izmišlja cijene, porezne stope, identitete ni datume. Financijske, porezne, pravne i identifikacijske izmjene zahtijevaju ručnu potvrdu. U usage/audit tablice spremaju se samo sigurni metapodaci, bez prompta ili sadržaja dokumenta.

Migracija `202608010002_ai_copilot.sql` priprema organizacijske AI postavke, zahtjeve, kredite i povijest odluka uz RLS izolaciju. Stripe nije dio ove faze.
