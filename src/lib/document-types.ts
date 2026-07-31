export const documentTypes = [
  "cv",
  "invoice",
  "offer",
  "contract",
  "request",
  "termination",
  "purchase-order",
  "minutes",
  "certificate",
  "business-letter",
] as const;

export type DocumentType = (typeof documentTypes)[number];

export type DocumentTypeDefinition = {
  label: string;
  description: string;
};

export const documentTypeDefinitions: Record<DocumentType, DocumentTypeDefinition> = {
  cv: { label: "CV", description: "Predstavite iskustvo, obrazovanje i vještine." },
  invoice: { label: "Faktura", description: "Unesite izdavatelja, kupca, stavke i porezne podatke." },
  offer: { label: "Ponuda", description: "Pripremite jasnu ponudu s automatskim izračunom." },
  contract: { label: "Ugovor", description: "Definirajte ugovorne strane, predmet i uvjete." },
  request: { label: "Zahtjev / molba", description: "Sastavite formalni zahtjev primatelju." },
  termination: { label: "Otkaz", description: "Pripremite podatke za izjavu o otkazu." },
  "purchase-order": { label: "Narudžbenica", description: "Evidentirajte naručitelja, dobavljača i naručene stavke." },
  minutes: { label: "Zapisnik", description: "Zabilježite sudionike, dnevni red i odluke." },
  certificate: { label: "Potvrda", description: "Unesite izdavatelja, primatelja i svrhu potvrde." },
  "business-letter": { label: "Poslovno pismo", description: "Pripremite strukturirano poslovno obraćanje." },
};

const detectionRules: Array<{ type: DocumentType; keywords: string[] }> = [
  { type: "cv", keywords: ["cv", "životopis", "zivotopis", "biografij"] },
  { type: "invoice", keywords: ["faktur", "račun", "racun"] },
  { type: "offer", keywords: ["ponud", "predračun", "predracun"] },
  { type: "contract", keywords: ["ugovor"] },
  { type: "request", keywords: ["zahtjev", "zahtev", "molb", "godišnji odmor", "godisnji odmor"] },
  { type: "termination", keywords: ["otkaz"] },
  { type: "purchase-order", keywords: ["narudžben", "narudzben", "narudžb", "narudzb"] },
  { type: "minutes", keywords: ["zapisnik"] },
  { type: "certificate", keywords: ["potvrd"] },
  { type: "business-letter", keywords: ["poslovno pismo", "poslovni email", "poslovni e-mail", "dopis"] },
];

export function detectDocumentType(input: string): DocumentType | null {
  const normalizedInput = input.trim().toLocaleLowerCase("hr");
  return detectionRules.find((rule) => rule.keywords.some((keyword) => normalizedInput.includes(keyword)))?.type ?? null;
}

export function isDocumentType(value: string | undefined): value is DocumentType {
  return documentTypes.includes(value as DocumentType);
}
