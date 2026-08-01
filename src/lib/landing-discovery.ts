import { documentTypeDefinitions, documentTypes, type DocumentType } from "./document-types";
import { categoryForDocument } from "./analytics/service";

export type DiscoverySuggestion = {
  type: DocumentType;
  label: string;
  description: string;
  category: ReturnType<typeof categoryForDocument>;
  confidence: number;
  reason: string;
};

const aliases: Record<DocumentType, string[]> = {
  cv: ["cv", "životopis", "zivotopis", "biografija", "radno iskustvo"],
  invoice: ["faktura", "račun", "racun", "obračun", "obracun"],
  proforma: ["predračun", "predracun", "proforma", "avans", "zahtjev za uplatu"],
  offer: ["ponud", "troškovnik", "troskovnik"],
  contract: ["ugovor", "sporazum"],
  request: ["zahtjev", "molba", "reklamacija", "zahtjev dobavljaču"],
  termination: ["otkaz", "raskid"],
  "purchase-order": ["narudžbenica", "narudzbenica", "naruči", "naruci", "narudžba", "materijal"],
  minutes: ["zapisnik", "sastanak", "popis grešaka", "popis gresaka"],
  certificate: ["potvrda", "uvjerenje"],
  "business-letter": ["poslovni email", "poslovni e-mail", "mail dobavljaču", "email dobavljaču", "dopis", "odgovor dobavljaču"],
  "daily-report": ["dnevni izvještaj", "dnevni izvjestaj", "dnevnik gradilišta", "dnevnik gradilista", "građevinski dnevnik"],
  "completed-works-report": ["izvedeni radovi", "izvještaj o radovima", "izvjestaj o radovima"],
  "work-handover": ["primopredaja", "primopredajni", "nedostaci", "snag list"],
};

export function discoverDocuments(input: string, limit = 5): DiscoverySuggestion[] {
  const query = input.trim().toLocaleLowerCase("hr");
  if (query.length < 2) return [];
  return documentTypes
    .map((type) => {
      const matches = aliases[type].filter((term) => query.includes(term));
      const exactLabel = query.includes(documentTypeDefinitions[type].label.toLocaleLowerCase("hr"));
      const confidence = Math.min(0.98, (exactLabel ? 0.9 : 0) + (matches.length ? 0.76 + matches.length * 0.1 : 0));
      return { type, confidence, matches };
    })
    .filter((item) => item.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit)
    .map(({ type, confidence, matches }) => ({
      type,
      label: documentTypeDefinitions[type].label,
      description: documentTypeDefinitions[type].description,
      category: categoryForDocument(type),
      confidence,
      reason: matches.length ? `Podudaranje: ${matches[0]}` : "Prepoznat naziv dokumenta",
    }));
}

export function confidenceRange(value: number) {
  return value >= 0.85 ? "high" as const : value >= 0.6 ? "medium" as const : "low" as const;
}
