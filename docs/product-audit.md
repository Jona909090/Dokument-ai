# Dokument AI — audit proizvoda

Datum audita: 1. kolovoza 2026. Audit je statička i lokalna provjera repozitorija; vanjske usluge nisu proglašene provjerenima bez vjerodajnica i stvarnog okruženja.

## Legenda

- **Funkcionalno** — implementirano i pokriveno lokalnim testom ili provjerljivim tokom.
- **Djelomično** — jezgra radi, ali nije dovršena cijela obećana površina.
- **Demo** — namjerno lokalni ili mock adapter, jasno označen.
- **Placeholder** — ruta postoji, ali nema završnu funkciju.
- **Vanjsko** — zahtijeva konfiguriranu uslugu i nije end-to-end potvrđeno ovim auditom.

## Inventar

- 36 stranica, 7 API ruta, 7 Supabase migracija i 21 testna datoteka.
- 14 registriranih vrsta dokumenta: CV, faktura, predračun, ponuda, ugovor, zahtjev/molba, otkaz, narudžbenica, zapisnik, potvrda, poslovno pismo, dnevni izvještaj, izvještaj o izvedenim radovima i primopredaja.
- Posebni profesionalni editor/export tokovi postoje za fakturu, ponudu, predračun, narudžbenicu, dnevni izvještaj, izvedene radove i primopredaju. Ostali tipovi koriste generički model.

## Matrica proizvoda

| Područje | Status | Dokaz / ograničenje |
|---|---|---|
| Landing, generator i lokalni wizard | Funkcionalno | Parser, koraci, validacija, live preview i testovi lokalne logike. |
| Command palette | Funkcionalno | Svih 14 tipova; Ctrl/Cmd+K, strelice, Enter i Escape. |
| PDF/DOCX | Djelomično | Lokalni export postoji; specijalizirani exporti za 7 tipova, generički fallback za ostale. Vizualna jednakost nije pixel-level testirana. |
| Lokalni dokumenti, kontakti i firma | Demo | `localStorage`, izmišljeni seed podaci i jasna demo oznaka. Nije za osjetljive produkcijske podatke. |
| Supabase Auth | Vanjsko | Registracija, prijava, callback, reset i proxy postoje; stvarna isporuka emaila nije potvrđena. |
| Cloud dokumenti/dashboard | Djelomično/vanjsko | Supabase upiti postoje, ali većina generatora i projekata još koristi lokalne repositoryje. |
| Template/design/paper engine | Djelomično | Centralni modeli, teme, visibility, composer i preview postoje; nisu svi posebni exporteri migrirani na identičan renderer. |
| Universal composer | Djelomično | Blokovi, reorder, DnD, visibility, binding i undo/redo rade lokalno; napredni DOCX ostaje generički fallback. |
| Analitika | Demo | Privacy-safe lokalni događaji i demo dashboard; Supabase adapter nije aktivan. |
| AI Copilot | Demo/vanjsko | Mock je zadani provider; OpenAI je server-side opcija i nije testiran stvarnim ključem. |
| Billing | Demo/vanjsko | Mock je zadani provider; Stripe routeovi/webhook projekcija postoje, stvarna naplata nije potvrđena. |
| Projekti | Demo/djelomično | Lokalni workspace i temelj baze postoje; puni cloud CRUD svih modula nije spojen. |
| Platform admin | Djelomično/vanjsko | Odvojene uloge i SQL temelj postoje; bez Supabasea prikazuje demo/prazno stanje. |
| Globalna pretraga | Djelomično | Dokumentni filtri rade; header pretraga samo prosljeđuje upit dashboardu i nije federirana kroz sve module. |
| Obavijesti | Demo | Statična poruka dobrodošlice; nema trajni inbox ni backend događaje. |
| Kontakt | Placeholder | Jasno označeno “uskoro”. |
| Privatnost i uvjeti | Placeholder/P0 release blocker | Tekstovi nisu pravno dovršeni; javno lansiranje se ne preporučuje. |

## Ispravljeno u stabilizaciji

1. Command palette više ne izostavlja 5 registriranih tipova i stvarno podržava oglašene tipke.
2. Cloud dashboard više ne prikazuje lokalni demo identitet ni demo upozorenje; identitet dolazi iz Supabase sesije/profila.
3. Provjereno je da nema teksta “Profesionalno pripremljen dokument”, hardkodirane 2006. godine ni Lorem ipsum sadržaja.

## Otvoreni prioriteti

- **P0:** pravno odobriti Privacy/Terms; primijeniti migracije u stagingu i izvršiti RLS negative testove; end-to-end potvrditi auth/email i povrat lozinke.
- **P1:** spojiti generator, projekte, analitiku i profile na jedinstveni cloud repository; završiti Stripe/OpenAI staging testove; uvesti E2E i vizualnu regresiju PDF/DOCX/printa.
- **P2:** federirana globalna pretraga, stvarne obavijesti, zasebni poslovni email i zapisnik o nedostacima, dovršeni help/contact sadržaj.

## Zaključak

Projekt je kvalitetan lokalni/staging temelj, ali nije spreman za javno produkcijsko lansiranje. Preporučeni status je **NO-GO za javnu produkciju**, odnosno **GO za zatvoreni lokalni/staging QA**.
