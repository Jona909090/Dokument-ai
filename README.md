# Dokument AI

## Premium AI-first početna stranica

Početna stranica objedinjuje dva stvarna toka: lokalno prepoznavanje zahtjeva u velikom prompt polju i ručni katalog svih registriranih dokumenata. Suggestion engine ne šalje prompt van aplikacije, ne izmišlja sadržaj i u analitiku sprema samo tip dokumenta, kategoriju, raspon pouzdanosti i ishod. Odabrani tip i originalni tekst prenose se postojećem wizardu putem URL parametara.

Landing uključuje quick actions, klikabilne primjere, pretragu i kategorije svih obrazaca, omiljene u trenutačnoj sesiji, product preview, proces rada, stvarno označene mogućnosti, before/after, template/paper showcase, responsive header/footer i reduced-motion ponašanje.

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

Migracija `202608010002_ai_copilot.sql` priprema organizacijske AI postavke, zahtjeve, kredite i povijest odluka uz RLS izolaciju. AI kreditni limiti sada se čitaju iz centralnog billing kataloga.

## Stripe naplata i SaaS paketi

Billing je centraliziran u `src/lib/billing`. UI nikada ne poziva Stripe izravno: Checkout, Customer Portal, otkazivanje i webhookovi prolaze kroz server route handlere i `BillingProvider`. Bez potpunih Stripe varijabli sustav automatski koristi jasno označen `MockBillingProvider`; demo tok ne stvara stvarne uplate.

### Stripe test mode setup

1. Kreirajte Stripe račun i uključite Test mode.
2. Napravite Products/Prices za Basic, Pro i Business, zasebno za mjesečni i godišnji interval.
3. Kopirajte `.env.example` u `.env.local` i unesite samo testne vrijednosti:

```env
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_BASIC_MONTHLY=
STRIPE_PRICE_BASIC_YEARLY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
STRIPE_PRICE_BUSINESS_MONTHLY=
STRIPE_PRICE_BUSINESS_YEARLY=
BILLING_PROVIDER=stripe
BILLING_ENABLED=true
```

`STRIPE_SECRET_KEY` i `STRIPE_WEBHOOK_SECRET` moraju ostati server-side i nikada ne smiju imati `NEXT_PUBLIC_` prefiks. Price ID uvijek bira server iz centralnog plana; browser ne šalje niti određuje cijenu.

Webhook endpoint je `/api/billing/webhook`. Za lokalni test koristite Stripe CLI:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Dobiveni `whsec_...` unesite samo u lokalni `STRIPE_WEBHOOK_SECRET`. U Stripe Dashboardu konfigurirajte Customer Portal i za produkciju registrirajte Vercel webhook URL. Checkout redirect prikazuje samo status obrade; prava se dodjeljuju tek nakon verificiranog webhooka i sinkronizacije baze.

### Paketi, trial, kuponi i sinkronizacija

Centralni katalog definira Free, Basic, Pro i Business, mjesečne/godišnje cijene, entitlements, usage limite i AI kredite. Migracija `202608010003_billing_platform.sql` dodaje planove, cijene, pretplate, kupone, račune, plaćanja, usage događaje, obavijesti i idempotentne Stripe webhook zapise s RLS pravilima. Postojeće organizacije bez pretplate dobivaju Free projekciju, bez brisanja podataka.

Stripe kuponi moraju imati povezani interni zapis prije produkcijske upotrebe. `DEMO20` postoji samo u mock provideru. Trial je 7 dana za Basic te 14 dana za Pro/Business, ali se u UI-u smatra aktivnim samo kada je potvrđen u bazi ili Stripeu.

### Produkcijski checklist

- primijeniti Supabase migracije i provjeriti RLS
- unijeti Vercel server-side tajne i stvarne Price ID-eve
- registrirati i testirati webhook signature
- konfigurirati Customer Portal
- uskladiti stvarne Stripe cijene s tablicom `plan_prices`
- testirati Checkout, failed payment, grace period i otkazivanje u Stripe test modu
- uključiti porezni sloj samo nakon zasebne Stripe Tax konfiguracije
- provjeriti webhook reconciliation prije uključivanja live ključeva

## Globalni design system dokumenata

`src/lib/document-design` je jedini izvor design tokena za dokumente. `DocumentStyleConfig` verzije 2 sadrži temu, font par, boje, gustoću, header/footer/table/section/total/signature varijante, papir, margine i watermark. Novi i stari spremljeni dokumenti prolaze kroz `migrateDocumentStyle`; dokument bez konfiguracije dobiva siguran, dokument-specifičan default bez gubitka sadržaja.

Ugrađene teme su Corporate Blue, Executive Black, Construction Orange, Minimal Gray, Modern Green, Elegant Gold, Professional Navy, Clean White, Technical Steel, Classic Business, Premium Dark Header i Soft Modern. One mijenjaju kombinaciju tipografije, headera, tablice, sekcija, sažetaka, gustoće i palete, a ne samo jednu boju. Font kombinacije su Inter/Source Sans, Montserrat/Open Sans, Lato/Merriweather, Roboto/Roboto Slab, Poppins/Noto Sans, Work Sans/Source Serif i IBM Plex Sans/Serif.

Generator ima Simple način za sadržaj i osnovni style panel te Advanced način koji dodatno otvara Template Engine i visibility kontrole. Promjena načina ne resetira formu. Style panel mijenja temu, fontove, boju, gustoću, header, tablicu, font size, margine i watermark u live A4 prikazu. Preview ima zoom 50–150%, fit page, prikaz margina i fullscreen modal. CSS tokeni se primjenjuju na sve specijalizirane sheet komponente, uz poseban karakter za CV, financijske dokumente, ponudu, narudžbenicu, tehničke izvještaje, primopredaju i poslovno pismo.

Generički PDF i DOCX čitaju isti style config za boje, tipografiju, margine, orijentaciju, tablice, header i footer. Specijalizirani invoice/quotation/purchase-order/report exporteri zadržavaju vlastiti provjereni višestranični layout; njihovo potpuno mapiranje svih novih header/footer/table varijanti ostaje zaseban posao i ne prikazuje se kao dovršen. Print koristi iste CSS tokene kao preview. Zabranjeni generički marketinški podnaslov uklonjen je iz previewa, PDF-a i DOCX-a.

Dodavanje nove teme zahtijeva novi zapis u `documentThemes`; dodavanje novog dokumenta zahtijeva njegov default u `characterThemes` i style test. Brand Kit tip i default-by-document ugovor su pripremljeni, ali cloud CRUD za više Brand Kitova zahtijeva Supabase migraciju i nije simuliran lokalnim kontrolama.

### Paper Design Engine

`PaperDesignConfig` je dio svakog `DocumentStyleConfig` zapisa i definira boju/intenzitet papira, uzorak, dekorativne linije i oblike, sigurnu zonu, varijante stranica te print-safe/crno-bijeli prikaz. Stari dokument bez paper konfiguracije automatski dobiva bijeli papir, bez uzorka, sa sigurnom zonom i uključenim Print Safe Modeom.

Paleta uključuje čistu, toplu i hladnu bijelu, svijetlosivu, krem, slonovaču, vrlo svijetloplavu, vrlo svijetlozelenu, vrlo svijetlobež i svijetli pijesak te vlastiti HEX unos. Panel provjerava WCAG kontrast teksta i papira, nudi automatsku korekciju i prikazuje informativnu malu/srednju/veliku potrošnju tinte.

Uzorci su horizontalne/vertikalne/diagonalne linije, tehnička i točkasta mreža, geometrija, kutni detalji, bočne/gornje/donje linije, okvir, blueprint, construction grid, valovi, minimalni oblici, elegantne krivulje i papirna tekstura. Dekorativni slojevi su uvijek ispod sadržaja, potpisa, pečata, headera i footera. Print Safe smanjuje intenzitet dekoracija, a crno-bijeli preview koristi grayscale bez promjene spremljenih podataka.

Ugrađeni preseti su Pure White, Warm Ivory, Corporate Blue Line, Minimal Gray, Technical Grid, Construction Blueprint Light, Elegant Gold Accent, Executive Dark Header, Soft Green, Classic Border, Modern Geometry, Clean Letterhead, Subtle Waves, Industrial Steel i Custom. Svaka vrsta dokumenta dobiva primjeren paper default. `paper-store.ts` podržava lokalni ugovor za dupliciranje, spremanje, preimenovanje, brisanje korisničkog preseta, zadane veze po firmi/tipu, recent colors te JSON import/export. Sistemski preset se ne može spremiti kao izmijenjeni bez dupliciranja.

Live preview i Print prenose boju, CSS uzorke, linije, oblike i watermark. Generički PDF prenosi boju papira, print-safe linije, podržane mreže i okvir; složene valove/krivulje pojednostavljuje. DOCX pouzdano prenosi boje teksta, tipografiju, margine, header i tablice, ali Word nema stabilan ekvivalent za sve pozadinske CSS slojeve pa se napredni uzorci namjerno svode na neutralni dokument umjesto rizične pozadinske slike.

## Universal Document Composer

Composer je opt-in Advanced editor nad `GeneratedDocument.composer`. Centralni `ContentBlock` model sadrži type, content, position, visibility, style, layout/width, page behavior, siguran data binding, uvjete, locking, metadata i opcionalnu djecu. Registry sadrži 40+ poslovnih, tabličnih, vizualnih, strukturnih i građevinskih blokova. Dodavanje novog tipa zahtijeva definiciju u `src/lib/composer/registry.ts` i renderer granu; sadržaj mora ostati JSON-serializable.

Korisnik može stvarno dodati, urediti, duplicirati, sakriti, zaključati, obrisati i premjestiti blok. Native drag-and-drop podržava biblioteku → dokument i promjenu redoslijeda; tipkovno pristupačne kontrole Gore/Dolje daju isti rezultat. Brisanje traži potvrdu i može se vratiti lokalnim Composer Undo/Redo stackom. Svaka promjena ide kroz parent `updateLive`, pa koristi postojeći debounce autosave i history dokumenta.

Binding engine prihvaća samo ograničene property putanje poput `company.name`; blokira `constructor`, `prototype`, `__proto__`, funkcije i proizvoljan kod. Condition builder model podržava empty/not-empty, equals/not-equals, numeričke usporedbe i contains. Ograničeni formula engine podržava sum, multiply, percent, average, min i max bez `eval`.

`migrateGeneratedDocument` nedestruktivno pretvara naslov, popunjena generička polja, stavke i financijski sažetak u blokove. Izvorni dokument se ne mijenja. Specijalizirani invoice/quotation/purchase-order/construction modeli nisu automatski konvertirani jer parcijalna migracija može izgubiti porezne stope, potpise, fotografije ili tehničke tablice; Composer se za njih uključuje samo svjesno i postojeći model ostaje spremljen uz block model.

Preview i Print koriste `ComposerRenderer` i isti grid od 12 kolona. PDF i DOCX čuvaju redoslijed, tekst, osnovne tablice, vidljivost, page-break i keep-together semantiku. DOCX pojednostavljuje grid širine, napredne CSS callout stilove, pozadinske slojeve i nestandardne vizualne blokove u stabilne Word paragrafe/tablice. Rich text je trenutno siguran plain-text sadržaj; proizvoljan HTML se ne renderira.

Cover page/master-page tipovi, reusable block tip, nested section model i page behavior ugovori su pripremljeni. Potpuni vizualni builders za custom tablice/sekcije, reusable cloud biblioteku, AI block akcije, master page UI, cross-page canvas drop, organizacijski locking i Supabase version history nisu predstavljeni kao dovršene funkccije.

## Project management i građevinska operativa

Projektni workspace dostupan je na `/projects`. U lokalnom demo načinu koristi centralni `ProjectRepository`/`ProjectService` ugovor i podatke čuva u browseru. To omogućuje kreiranje, pretragu, dupliranje i arhiviranje projekta, uređivanje osnovnih postavki te stvarno dodavanje i promjenu statusa zadataka bez Supabase konfiguracije. Demo oznaka je namjerna: produkcijski podaci se ne izmišljaju.

Svaki projekt ima pregled, zadatke/Kanban, dokumente, radnike i sate, materijale, opremu, troškove i budžet, probleme/rizike/nedostatke, fotografije, sastanke, izvještaje i postavke. Dashboard metrike računaju se iz operativnih zapisa. Dnevni izvještaj može se otvoriti kroz postojeći generator; ostali izvještaji su vidljivo onemogućeni dok projektni Supabase adapter nije povezan.

Projektne uloge su `project_owner`, `project_manager`, `site_manager`, `foreman`, `engineer`, `supervisor`, `accountant`, `procurement`, `subcontractor_manager`, `worker` i `viewer`. Dozvole se provjeravaju u servisnom sloju, a migracija `202608010005_project_operations.sql` dodaje server-side projektne RLS funkcije i politike. Financijski modul je ograničen na uloge s financijskim pravima; UI skrivanje nije sigurnosna kontrola.

Migracija proširuje postojeće projekte, faze, lokacije i dokumente te priprema zadatke i ovisnosti, radnike/ekipe/sate, materijalne zahtjeve/dostave/skladište, opremu, troškove/budžete, probleme/rizike, sastanke, fotografije, milestoneove, kalendar, approvals, checkliste, predloške i activity feed. Važni poslovni zapisi koriste `deleted_at`/`archived_at`, a veze prema projektu nemaju destruktivni cascade delete.

Produkcijsko uključivanje:

1. Primijeniti sve Supabase migracije redom i pregledati RLS u staging projektu.
2. Implementirati Supabase `ProjectRepository` adapter nad istim ugovorom iz `src/lib/projects/repository.ts`.
3. Učitavati svaki modul zasebnim paginiranim upitom; ne vraćati cijeli projektni snapshot u jednom produkcijskom zahtjevu.
4. Za projektne fotografije koristiti privatni Storage i kratkotrajne signed URL-ove.
5. Provjeriti projektne uloge na serveru za svaku write/approval/export radnju.

Napredni drag-and-drop Gantt, puni kalendar, CSV import preview, offline sync, višekoračna approvals automatizacija, kompresija fotografija, specijalizirani CRUD obrasci svih modula i AI Project Copilot nisu predstavljeni kao završeni. Shema i servisne granice su pripremljene; AI akcije moraju dobiti samo dozvoljeni projektni kontekst i nikada ne smiju mijenjati podatke bez potvrde.

Project domain testovi pokrivaju lifecycle projekta, spremanje zadatka, metrike i role/financial permissions. Pokrenite `npm run test`, `npm run lint` i `npm run build` prije primjene migracije.

## Platform Admin centar

Platform administracija dostupna je na `/admin` i potpuno je odvojena od organizacijskih uloga. Owner ili admin organizacije nije automatski platform administrator. Kada Supabase nije konfiguriran prikazuje se samo lokalni demo centar s praznim metrikama; nema lažnih produkcijskih podataka.

### Prvi super admin

Najprije primijenite `202608010004_platform_admin_center.sql`, kreirajte korisnika kroz Supabase Auth i njegov UUID ručno upišite kroz Supabase SQL Editor ili drugi strogo kontrolirani service-role postupak:

```sql
insert into public.platform_admins(user_id, role, display_name, status)
values ('AUTH_USER_UUID', 'super_admin', 'Platform Owner', 'active');
```

Ne dodavati javnu signup mogućnost za platform admina. Uloge su `super_admin`, `platform_admin`, `support_agent`, `billing_admin`, `content_admin`, `analyst` i `readonly_admin`. Svaki admin modul provjerava dopuštenje na serveru; skrivanje navigacije nije sigurnosna kontrola.

### Privatnost podrške

Admin liste koriste samo profile, identifikatore i agregirane metapodatke. Sadržaj dokumenta nije dio admin dashboard upita. Ako korisnik podijeli konkretan dokument, zapis u `support_document_access` mora imati rok isteka, opcionalnog točno određenog agenta, mogućnost opoziva i odvojeno dopuštenje za download. Svaki pristup bilježi se u `support_access_events`.

### CMS, promptovi i verzije

CMS, help članci, email predlošci, vrste dokumenata, planovi, AI promptovi i AI sheme koriste draft/review/publish verzije. Objavljena verzija se ne mijenja izravno; promjena stvara novu verziju, zahtijeva testni rezultat i može se vratiti kroz novu draft rollback verziju. CMS sadržaj mora proći sanitizaciju i ne prihvaća proizvoljni script ili event-handler HTML.

### Audit, maintenance i izvoz

Privilegirane radnje zapisuju se u `platform_audit_logs` sa sigurnim metapodacima. Tablica nema obične UPDATE ili DELETE politike. Maintenance postavke čuvaju se u `system_settings`; platform admini su jedini predviđeni whitelist. Admin izvoz dopušta samo unaprijed odobrena polja, nikada sadržaj dokumenata, promptove, interne support napomene ili tajne. Svaki izvoz mora stvoriti audit zapis i vremenski ograničenu datoteku.

Admin dozvole testiraju se naredbom `npm run test`. Produkcijski test mora obuhvatiti permission denied za običnog korisnika, support/billing/analyst ograničenja, istek support pristupa, CMS publish bez testa i immutable audit povijest.
