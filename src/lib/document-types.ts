export const documentTypes = [
  "cv",
  "invoice",
  "proforma",
  "offer",
  "contract",
  "request",
  "termination",
  "purchase-order",
  "minutes",
  "certificate",
  "business-letter",
  "daily-report",
  "completed-works-report",
  "work-handover",
] as const;

export type DocumentType = (typeof documentTypes)[number];

export type DocumentTypeDefinition = {
  label: string;
  description: string;
};

export const documentTypeDefinitions: Record<DocumentType, DocumentTypeDefinition> = {
  cv: { label: "CV", description: "Predstavite iskustvo, obrazovanje i vještine." },
  invoice: { label: "Faktura", description: "Unesite izdavatelja, kupca, stavke i porezne podatke." },
  proforma: { label: "Predračun", description: "Pripremite zahtjev za uplatu, avans ili raspored rata." },
  offer: { label: "Ponuda", description: "Pripremite jasnu ponudu s automatskim izračunom." },
  contract: { label: "Ugovor", description: "Definirajte ugovorne strane, predmet i uvjete." },
  request: { label: "Zahtjev / molba", description: "Sastavite formalni zahtjev primatelju." },
  termination: { label: "Otkaz", description: "Pripremite podatke za izjavu o otkazu." },
  "purchase-order": { label: "Narudžbenica", description: "Evidentirajte naručitelja, dobavljača i naručene stavke." },
  minutes: { label: "Zapisnik", description: "Zabilježite sudionike, dnevni red i odluke." },
  certificate: { label: "Potvrda", description: "Unesite izdavatelja, primatelja i svrhu potvrde." },
  "business-letter": { label: "Poslovno pismo", description: "Pripremite strukturirano poslovno obraćanje." },
  "daily-report": { label: "Dnevni izvještaj sa gradilišta", description: "Evidentirajte radnike, radove, materijal, strojeve, probleme i fotografije." },
  "completed-works-report": { label: "Izvještaj o izvedenim radovima", description: "Pratite faze, količine, dokaze, kvalitetu i vrijednost izvedenih radova." },
  "work-handover": { label: "Zapisnik o primopredaji radova", description: "Evidentirajte sudionike, prihvat, nedostatke, rokove, opremu i potpise." },
};

const detectionRules: Array<{ type: DocumentType; keywords: string[] }> = [
  { type: "cv", keywords: ["cv", "životopis", "zivotopis", "biografij"] },
  { type: "proforma", keywords: ["predračun", "predracun", "proforma", "zahtjev za uplatu"] },
  { type: "invoice", keywords: ["faktur", "račun", "racun"] },
  { type: "offer", keywords: ["ponud"] },
  { type: "contract", keywords: ["ugovor"] },
  { type: "request", keywords: ["zahtjev", "zahtev", "molb", "godišnji odmor", "godisnji odmor"] },
  { type: "termination", keywords: ["otkaz"] },
  { type: "purchase-order", keywords: ["narudžben", "narudzben", "narudžb", "narudzb"] },
  { type: "minutes", keywords: ["zapisnik"] },
  { type: "certificate", keywords: ["potvrd"] },
  { type: "business-letter", keywords: ["poslovno pismo", "poslovni email", "poslovni e-mail", "dopis"] },
  { type: "daily-report", keywords: ["dnevni izvještaj", "dnevni izvjestaj", "građevinski dnevnik", "gradilisni dnevnik", "gradilišni dnevnik"] },
  { type: "completed-works-report", keywords: ["izvještaj o izvedenim radovima", "izvjestaj o izvedenim radovima", "izvedeni radovi"] },
  { type: "work-handover", keywords: ["zapisnik o primopredaji", "primopredaja radova", "primopredajni zapisnik"] },
];

export function detectDocumentType(input: string): DocumentType | null {
  const normalizedInput = input.trim().toLocaleLowerCase("hr");
  return detectionRules.find((rule) => rule.keywords.some((keyword) => normalizedInput.includes(keyword)))?.type ?? null;
}

export function isDocumentType(value: string | undefined): value is DocumentType {
  return documentTypes.includes(value as DocumentType);
}
