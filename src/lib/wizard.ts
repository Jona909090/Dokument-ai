import { documentTypeDefinitions, type DocumentType } from "./document-types";
import type { GeneratedDocument } from "./generated-document";

export type TemplateGroup = "construction" | "administration" | "legal" | "finance" | "hr" | "personal";
export type WizardQuestion = { id: string; question: string; label: string; placeholder: string; required?: boolean; type?: "text" | "date" | "email" | "multiline" };

export const templateGroups: Array<{ id: TemplateGroup; label: string; description: string; types: DocumentType[] }> = [
  { id: "construction", label: "Građevina", description: "Ponude, narudžbenice i gradilišni izvještaji", types: ["offer", "purchase-order", "daily-report", "minutes"] },
  { id: "administration", label: "Administracija", description: "Zahtjevi, potvrde i pisma", types: ["request", "certificate", "business-letter"] },
  { id: "legal", label: "Pravni", description: "Ugovori i službene izjave", types: ["contract", "termination"] },
  { id: "finance", label: "Financije", description: "Fakture, predračuni i poslovne ponude", types: ["invoice", "proforma", "offer"] },
  { id: "hr", label: "HR", description: "CV, ugovori i otkazi", types: ["cv", "contract", "termination"] },
  { id: "personal", label: "Privatni", description: "Molbe, potvrde i pisma", types: ["request", "certificate", "business-letter"] },
];

const common: Record<string, WizardQuestion> = {
  date: { id: "date", question: "Koji datum treba stajati na dokumentu?", label: "Datum", placeholder: "Odaberite datum", type: "date", required: true },
  notes: { id: "notes", question: "Želite li dodati napomenu?", label: "Napomena", placeholder: "Neobavezna završna napomena", type: "multiline" },
};

export const wizardQuestions: Record<DocumentType, WizardQuestion[]> = {
  "daily-report": [
    { id: "project", question: "Koji je naziv projekta?", label: "Projekt", placeholder: "Naziv projekta", required: true },
    { id: "site", question: "Koje je gradilište?", label: "Gradilište", placeholder: "Naziv i adresa", required: true },
    common.date,
    { id: "manager", question: "Tko vodi gradilište?", label: "Voditelj gradilišta", placeholder: "Ime i prezime" },
    { id: "works", question: "Koji su radovi izvedeni?", label: "Izvedeni radovi", placeholder: "Opišite današnje radove", type: "multiline", required: true },
  ],
  proforma: [
    { id: "company", question: "Kako se zove izdavatelj predračuna?", label: "Naziv firme", placeholder: "npr. Gradnja d.o.o.", required: true },
    { id: "buyer", question: "Tko je kupac?", label: "Kupac", placeholder: "Naziv ili ime kupca", required: true },
    common.date,
    { id: "number", question: "Koji je broj predračuna?", label: "Broj predračuna", placeholder: "PRE-2026-001", required: true },
    { id: "items", question: "Koje stavke uključujemo?", label: "Stavke", placeholder: "Svaka stavka u novom redu", type: "multiline", required: true },
  ],
  invoice: [
    { id: "company", question: "Kako se zove firma koja izdaje fakturu?", label: "Naziv firme", placeholder: "npr. Gradnja d.o.o.", required: true },
    { id: "companyTaxId", question: "Koji je OIB ili porezni broj firme?", label: "OIB / porezni broj", placeholder: "Unesite porezni broj", required: true },
    { id: "buyer", question: "Tko je kupac?", label: "Kupac", placeholder: "Naziv tvrtke ili ime kupca", required: true },
    common.date,
    { id: "number", question: "Koji je broj fakture?", label: "Broj fakture", placeholder: "npr. 2026-001", required: true },
    { id: "items", question: "Koje stavke želite fakturirati?", label: "Stavke", placeholder: "Svaku stavku upišite u novi red", type: "multiline", required: true },
  ],
  offer: [
    { id: "company", question: "Kako se zove firma koja šalje ponudu?", label: "Naziv firme", placeholder: "npr. Gradnja d.o.o.", required: true },
    { id: "buyer", question: "Za kojeg kupca pripremamo ponudu?", label: "Kupac", placeholder: "Naziv klijenta", required: true },
    common.date,
    { id: "subject", question: "Što je predmet ponude?", label: "Predmet ponude", placeholder: "npr. Hidroizolacija podruma", required: true },
    { id: "items", question: "Koje radove ili proizvode nudite?", label: "Stavke", placeholder: "Svaku stavku upišite u novi red", type: "multiline", required: true },
    { id: "validity", question: "Koliko dugo ponuda vrijedi?", label: "Rok valjanosti", placeholder: "npr. 30 dana" },
  ],
  cv: [
    { id: "name", question: "Kako se zovete?", label: "Ime i prezime", placeholder: "Ime i prezime", required: true },
    { id: "title", question: "Koji je vaš profesionalni naslov?", label: "Profesionalni naslov", placeholder: "npr. Voditelj projekta", required: true },
    { id: "email", question: "Koja je vaša email adresa?", label: "Email", placeholder: "ime@primjer.hr", type: "email", required: true },
    { id: "experience", question: "Opišite svoje radno iskustvo.", label: "Radno iskustvo", placeholder: "Pozicija, tvrtka, razdoblje i odgovornosti", type: "multiline", required: true },
    { id: "education", question: "Koje je vaše obrazovanje?", label: "Obrazovanje", placeholder: "Škola, fakultet ili certifikati", type: "multiline", required: true },
    { id: "skills", question: "Koje vještine želite istaknuti?", label: "Vještine", placeholder: "Odvojite vještine zarezom", type: "multiline" },
  ],
  contract: [
    { id: "contractType", question: "Koju vrstu ugovora trebate?", label: "Vrsta ugovora", placeholder: "npr. Ugovor o radu", required: true },
    { id: "partyOne", question: "Tko je prva ugovorna strana?", label: "Prva ugovorna strana", placeholder: "Naziv ili ime", required: true },
    { id: "partyTwo", question: "Tko je druga ugovorna strana?", label: "Druga ugovorna strana", placeholder: "Naziv ili ime", required: true },
    { id: "subject", question: "Što je predmet ugovora?", label: "Predmet ugovora", placeholder: "Opišite predmet", type: "multiline", required: true },
    common.date,
    { id: "terms", question: "Koje posebne uvjete treba uključiti?", label: "Posebni uvjeti", placeholder: "Rok, naknada i ostali uvjeti", type: "multiline" },
  ],
  "purchase-order": [
    { id: "buyer", question: "Tko je naručitelj?", label: "Naručitelj", placeholder: "Naziv naručitelja", required: true },
    { id: "supplier", question: "Tko je dobavljač?", label: "Dobavljač", placeholder: "Naziv dobavljača", required: true },
    common.date,
    { id: "number", question: "Koji je broj narudžbenice?", label: "Broj narudžbenice", placeholder: "npr. N-2026-001", required: true },
    { id: "items", question: "Što želite naručiti?", label: "Naručene stavke", placeholder: "Stavke i količine, svaka u novom redu", type: "multiline", required: true },
    { id: "delivery", question: "Gdje i kada treba izvršiti isporuku?", label: "Isporuka", placeholder: "Adresa i rok isporuke", type: "multiline" },
  ],
  request: [
    { id: "requester", question: "Tko podnosi zahtjev ili molbu?", label: "Podnositelj", placeholder: "Ime ili naziv", required: true },
    { id: "recipient", question: "Kome se zahtjev šalje?", label: "Primatelj", placeholder: "Osoba ili institucija", required: true }, common.date,
    { id: "subject", question: "Koji je predmet zahtjeva?", label: "Predmet", placeholder: "Kratak naslov", required: true },
    { id: "content", question: "Što želite zatražiti?", label: "Sadržaj zahtjeva", placeholder: "Opišite zahtjev i obrazloženje", type: "multiline", required: true },
  ],
  termination: [
    { id: "employee", question: "Tko daje otkaz?", label: "Zaposlenik", placeholder: "Ime i prezime", required: true },
    { id: "employer", question: "Kojem poslodavcu se otkaz predaje?", label: "Poslodavac", placeholder: "Naziv poslodavca", required: true }, common.date,
    { id: "lastDay", question: "Koji je predloženi zadnji radni dan?", label: "Zadnji radni dan", placeholder: "Odaberite datum", type: "date" },
    { id: "reason", question: "Želite li navesti razlog?", label: "Razlog", placeholder: "Neobavezno obrazloženje", type: "multiline" },
  ],
  minutes: [
    { id: "title", question: "Koji je naziv sastanka?", label: "Naziv sastanka", placeholder: "Naziv sastanka", required: true }, common.date,
    { id: "participants", question: "Tko je sudjelovao?", label: "Sudionici", placeholder: "Imena sudionika", type: "multiline", required: true },
    { id: "agenda", question: "Koji je bio dnevni red?", label: "Dnevni red", placeholder: "Točke dnevnog reda", type: "multiline", required: true },
    { id: "decisions", question: "Koji su zaključci i odluke?", label: "Zaključci", placeholder: "Zabilježite odluke", type: "multiline", required: true },
  ],
  certificate: [
    { id: "issuer", question: "Tko izdaje potvrdu?", label: "Izdavatelj", placeholder: "Naziv ili ime", required: true },
    { id: "recipient", question: "Kome se potvrda izdaje?", label: "Primatelj", placeholder: "Naziv ili ime", required: true },
    { id: "purpose", question: "Koja je svrha potvrde?", label: "Svrha", placeholder: "Svrha izdavanja", required: true },
    { id: "statement", question: "Koje činjenice potvrđujemo?", label: "Izjava", placeholder: "Sadržaj potvrde", type: "multiline", required: true }, common.date,
  ],
  "business-letter": [
    { id: "sender", question: "Tko šalje poslovno pismo?", label: "Pošiljatelj", placeholder: "Ime ili tvrtka", required: true },
    { id: "recipient", question: "Kome se pismo šalje?", label: "Primatelj", placeholder: "Ime ili tvrtka", required: true }, common.date,
    { id: "subject", question: "Koji je predmet pisma?", label: "Predmet", placeholder: "Kratak naslov", required: true },
    { id: "content", question: "Što želite poručiti?", label: "Sadržaj pisma", placeholder: "Napišite sadržaj", type: "multiline", required: true },
  ],
};

export function buildWizardDocument(type: DocumentType, answers: Record<string, string>): GeneratedDocument {
  const questions = wizardQuestions[type];
  const items = "items" in answers ? answers.items.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((description) => ({ description, quantity: 1, price: 0, amount: 0 })) : undefined;
  return { type, title: documentTypeDefinitions[type].label, locale: "hr", fields: questions.filter((question) => question.id !== "items").map((question) => ({ label: question.label, value: answers[question.id] ?? "", type: question.type === "date" ? "date" : question.type === "multiline" ? "multiline" : undefined })), items };
}
