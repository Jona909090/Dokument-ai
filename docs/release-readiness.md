# Release readiness

Datum procjene: 1. kolovoza 2026.

## Odluka

| Cilj | Odluka |
|---|---|
| Lokalni razvoj i demonstracija | GO |
| Zatvoreni staging QA s testnim podacima | GO uz Supabase migraciju |
| Javni produkcijski SaaS | **NO-GO** |

## Release gateovi

- [ ] Testovi, lint i production build prolaze na čistom checkoutu.
- [ ] Supabase migracije prolaze od prazne baze, a RLS negative testovi su zeleni.
- [ ] Auth email, reset i redirect URL-ovi potvrđeni su na kanonskoj domeni.
- [ ] Privacy/Terms/Contact nisu placeholderi i imaju vlasnika sadržaja.
- [ ] Lokalni demo adapter ne može se slučajno aktivirati u produkciji.
- [ ] Stripe test mode checkout/portal/webhook i OpenAI staging tok imaju dokaz.
- [ ] PDF/DOCX/print vizualna regresija pokriva svih 14 tipova.
- [ ] Lighthouse i accessibility provjera imaju zabilježen URL, uređaj, verziju i rezultat.
- [ ] Secret scan, backup/restore i incident kontakti su potvrđeni.
- [ ] Vercel deployment status je provjeren na stvarnom deploymentu.

## Trenutačni blokatori

1. Stvarna baza i RLS nisu runtime testirani.
2. Pravni sadržaji su placeholderi.
3. Generator/projekti/analitika nisu svi na jedinstvenom cloud adapteru.
4. Vanjski OpenAI/Stripe/email tokovi nisu end-to-end potvrđeni.
5. Nema E2E, browser matrice, Lighthouse ni PDF/DOCX vizualne regresije u CI-u.

## Lokalna verifikacija ovog audita

- `npm run test`: 21/21 testnih datoteka i 218/218 testova prolazi.
- `npm run lint`: prolazi bez upozorenja ili grešaka.
- `npm run build`: Next.js 16.2.12 production build prolazi; generirano je 40 stranica/ruta. Build više ne zahtijeva dohvat Google fontova.
- `git diff --check`: prolazi; prikazana su samo očekivana Windows LF/CRLF upozorenja.
- E2E, Lighthouse, stvarni mobilni/browser test, Supabase runtime migracije, Stripe/OpenAI i Vercel nisu izvršeni te se ne navode kao uspješni.

## Postupak odobrenja

Product, engineering, security/privacy i operations moraju potpisati sve gateove. “Build prolazi” sam po sebi nije produkcijsko odobrenje. Svako odstupanje mora imati vlasnika, rok i prihvaćen rizik.
