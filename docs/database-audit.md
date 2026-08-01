# Audit baze podataka

## Statički inventar

- 7 verzioniranih migracija u `supabase/migrations`.
- 131 `CREATE TABLE` deklaracija (uključujući deklaracije kroz sve migracije; broj nije broj jedinstvenih tablica nakon primjene).
- 13 eksplicitnih `ENABLE ROW LEVEL SECURITY` deklaracija.
- 51 `CREATE POLICY` deklaracija.
- Domene obuhvaćaju SaaS dokumente, aktivnost, multi-tenant cloud, AI, billing, platform admin i projektne operacije.

## Stanje povezivanja

Supabase konfiguracija i server/browser klijenti postoje. Cloud dashboard i cloud popis dokumenata izravno čitaju bazu kada su javne Supabase varijable postavljene. Glavni `src/lib/data/config.ts` ipak eksplicitno koristi `activeDataAdapter = "local"`; generator, demo profil/kontakti i značajan dio projektnog modula zato nisu puni cloud CRUD.

## Nalazi

| Prioritet | Nalaz | Posljedica |
|---|---|---|
| P0 | Migracije nisu primijenjene u dostupnoj lokalnoj/staging bazi tijekom audita. | Ne možemo potvrditi sintaksu, redoslijed, funkcije, triggere ni RLS u runtimeu. |
| P0 | Cross-tenant test suite ne postoji protiv stvarnog Postgresa. | Izolacija organizacija ostaje nepotvrđena. |
| P1 | Lokalni i cloud tokovi nisu iza jednog aktivnog repository adaptera. | Različite stranice mogu prikazivati različite izvore istine. |
| P1 | Brojne migracije koriste veliku domensku površinu. | Potrebni su smoke rollback/restore i indeksni planovi na staging podacima. |
| P2 | Nema dokumentiranog retention/backup/restore testa. | Operativni oporavak nije potvrđen. |

## Obavezni staging testovi

1. `supabase db reset` ili ekvivalent na praznoj bazi.
2. Kreirati dvije organizacije i korisnike owner/member/viewer.
3. Za svaki tenant-owned resurs potvrditi dopušten vlastiti CRUD i odbijen tuđi read/write.
4. Testirati soft-delete, audit immutability, storage bucket pravila i service-role granicu.
5. Pokrenuti `EXPLAIN ANALYZE` za dashboard, dokumente, projekte, analitiku i admin filtre.
6. Izvesti backup te dokazani restore u novo okruženje.

## Zaključak

SQL je opsežan temelj, ali baza nije release-verified. Produkcijska migracija je **blokirana do uspješnog staging reset/migrate/RLS testa**.
