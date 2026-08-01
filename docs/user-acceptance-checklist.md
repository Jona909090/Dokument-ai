# User acceptance checklist

Ovaj popis treba izvršiti na desktopu, tabletu i telefonu te u Chromiumu, Firefoxu i Safariju. Svaku stavku označiti dokazom (screenshot, video ili test run), ne samo dojmovima.

## Javni i auth tok

- [ ] Landing nema mrtve CTA gumbe i vodi na očekivanu rutu.
- [ ] Registracija, email potvrda, prijava, odjava, reset i update lozinke rade na staging Supabaseu.
- [ ] Neprijavljeni korisnik ne može otvoriti zaštićene rute.
- [ ] Privacy, Terms i Contact imaju odobren završni sadržaj.

## Dokumenti

- [ ] Svih 14 registriranih tipova moguće je otvoriti iz wizarda i command palete.
- [ ] Parser prepoznaje hrvatske dijakritike i ASCII varijante.
- [ ] Obavezna polja prikazuju razumljivu grešku; podaci se ne gube pri Simple/Advanced prebacivanju.
- [ ] Visibility, reorder, duplicate, delete, undo/redo i autosave rade nakon ponovnog učitavanja.
- [ ] Jedna, 20 i 100 stavki pravilno se izračunavaju i prelamaju.
- [ ] PDF, DOCX, print i preview imaju isti redoslijed, visibility, total, margine i hrvatska slova.
- [ ] Cijene, popusti, više PDV stopa, valute i zaokruživanje provjereni su referentnim kalkulatorom.
- [ ] Stari spremljeni dokument bez style/composer konfiguracije otvara se bez gubitka.

## Cloud i tenant izolacija

- [ ] Dokument spremljen u cloud vidljiv je nakon nove sesije i može se urediti/izvesti/obrisati.
- [ ] Korisnik A ne može URL-om ili API pozivom vidjeti podatke organizacije B.
- [ ] Uloge owner/admin/member/viewer imaju samo dopuštene akcije.
- [ ] Projekti, kontakti, firma i dokumenti koriste isti tenant/source of truth.

## AI, billing i admin

- [ ] Mock UI je jasno označen i ne izgleda kao stvarno izvršena uplata ili AI rezultat.
- [ ] OpenAI timeout, limit, unsafe input i invalid output ne gube unos.
- [ ] Stripe success/cancel, webhook replay, failed payment, trial i portal testirani su u test modeu.
- [ ] Organizacijski admin nema platform-admin pristup.

## Kvaliteta

- [ ] Sve interaktivne kontrole dostupne su tipkovnicom i imaju vidljiv fokus.
- [ ] Screen reader čita labelu, grešku, required i promjenu stanja.
- [ ] Nema horizontalnog overflowa na 320 px.
- [ ] Lighthouse je pokrenut na produkcijskom buildu; pragovi i URL zapisani su u release izvještaju.
- [ ] Nema tajni, stvarnih korisničkih dokumenata ni privatnih fontova u buildu/repozitoriju.
