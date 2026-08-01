# Sigurnosni audit

Datum: 1. kolovoza 2026. Opseg: statička provjera Next.js aplikacije, API routeova, varijabli okruženja i Supabase migracija. Nije izveden penetration test niti test stvarnog produkcijskog Supabase/Stripe/OpenAI okruženja.

## Pozitivni nalazi

- Supabase sesija se osvježava u Next.js proxyju, a zaštićeni prefiksi preusmjeravaju anonimnog korisnika na prijavu.
- Server-only ključevi (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`) nemaju `NEXT_PUBLIC_` prefiks.
- AI i billing pozivi prolaze kroz server API; provider greške vraćaju ograničene javne poruke.
- Stripe webhook ima provjeru potpisa u stvarnom provideru i idempotentnu evidenciju događaja.
- Analitički tipovi ne uključuju sadržaj forme ni osobne/financijske vrijednosti.
- `.env.example` sadrži samo prazne vrijednosti; `.env*` je ignoriran osim primjera.

## Rizici

| Prioritet | Nalaz | Preporuka |
|---|---|---|
| P0 | 51 RLS politika i 13 `ENABLE RLS` deklaracija nisu izvršene niti negativno testirane u stvarnoj bazi. | Primijeniti migracije u izolirani staging i testirati cross-tenant read/write za svaku tablicu. |
| P0 | Privacy/Terms su placeholder sadržaj. | Pravno odobrenje prije javne registracije i obrade podataka. |
| P1 | Aplikacija ima lokalni fallback koji sprema dokumente u browser. | U produkciji eksplicitno onemogućiti lokalni adapter i prikazati fail-closed konfiguracijsku grešku. |
| P1 | Nema automatiziranog rate limiting sloja za auth/AI/billing API na razini edgea. | Dodati provider-agnostic rate limit i audit zapise bez prompta/sadržaja. |
| P1 | CSP/security headeri nisu dokumentirano verificirani deploymentom. | Dodati i testirati CSP, HSTS, frame-ancestors, referrer i permissions policy. |
| P2 | Clipboard, upload i URL polja trebaju kontinuirano testiranje sadržaja/MIME-a. | Ograničiti veličinu i tip, sanitizirati nazive i ne vjerovati client MIME-u. |

## Tajne i privatnost

Audit nije pronašao namjerno spremljene stvarne ključeve u `.env.example`. Nije izvršeno skeniranje cijele Git povijesti specijaliziranim secret scannerom. Prije releasea pokrenuti GitHub secret scanning ili Gitleaks i rotirati svaki ranije izloženi ključ.

## Zaključak

Sigurnosna arhitektura ima dobar temelj, ali produkcijski zaključak o tenant izolaciji nije moguć bez stvarno primijenjenih migracija i adversarial RLS testova. Status: **uvjetno za staging, nije odobreno za javnu produkciju**.
