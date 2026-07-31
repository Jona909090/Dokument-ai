import type { Company, Contact, SavedDocument, User } from "./models";
import { categoryForDocument } from "../analytics/service";
import type { DocumentType } from "../document-types";

const now = "2026-08-01T09:00:00.000Z";
export const demoUser: User = { id: "demo-user", firstName: "Demo", lastName: "Korisnik", email: "demo@dokument-ai.local", language: "hr", country: "Hrvatska", plan: "free", createdAt: now, updatedAt: now };
export const demoCompany: Company = { id: "demo-company", userId: demoUser.id, companyName: "Primjer Gradnja d.o.o.", logoUrl: "", address: "Primjer ulica 12", city: "Zagreb", postalCode: "10000", country: "Hrvatska", taxNumber: "00000000000", vatNumber: "HR00000000000", registrationNumber: "00000000", iban: "HR0023600000000000000", swift: "ZABAHR2X", bankName: "Primjer banka", phone: "+385 1 000 000", email: "ured@primjer.local", website: "https://primjer.local", responsiblePerson: "Demo Direktor", signatureUrl: "", stampUrl: "", createdAt: now, updatedAt: now };
export const demoContacts: Contact[] = [
  { id: "contact-alfa", userId: demoUser.id, companyName: "Alfa Projekt d.o.o.", contactName: "Demo Kontakt", address: "Testna 8", city: "Split", postalCode: "21000", country: "Hrvatska", taxNumber: "11111111111", email: "kontakt@alfa.local", phone: "+385 21 000 000", note: "Demo klijent", createdAt: now, updatedAt: now },
  { id: "contact-beta", userId: demoUser.id, companyName: "Beta Usluge d.o.o.", contactName: "Primjer Osoba", address: "Ogledna 4", city: "Rijeka", postalCode: "51000", country: "Hrvatska", taxNumber: "22222222222", email: "info@beta.local", phone: "+385 51 000 000", note: "Demo dobavljač", createdAt: now, updatedAt: now },
];

function document(id: string, type: DocumentType, title: string, number: string, status: SavedDocument["status"], contactId: string | null, total: number, daysAgo: number): SavedDocument {
  const date = new Date(Date.UTC(2026, 7, 1 - daysAgo, 9)).toISOString();
  return { id, userId: demoUser.id, companyId: demoCompany.id, contactId, documentType: type, documentCategory: categoryForDocument(type), title, documentNumber: number, status, language: "hr", currency: "EUR", subtotal: total / 1.25, taxAmount: total - total / 1.25, total, formData: {}, content: { type, title, locale: "hr", fields: [{ label: "Izdavatelj", value: demoCompany.companyName }, { label: "Datum", value: date.slice(0, 10), type: "date" }, { label: "Napomena", value: "Isključivo izmišljeni demo sadržaj.", type: "multiline" }] }, createdAt: date, updatedAt: date, lastOpenedAt: date };
}
export const demoDocuments: SavedDocument[] = [
  document("doc-offer", "offer", "Ponuda za završne radove", "P-2026-014", "completed", "contact-alfa", 6250, 1),
  document("doc-invoice", "invoice", "Faktura za demo usluge", "R-2026-031", "paid", "contact-beta", 1875, 3),
  document("doc-order", "purchase-order", "Narudžbenica materijala", "N-2026-009", "sent", "contact-beta", 3420, 5),
  document("doc-report", "minutes", "Dnevni izvještaj projekta", "IZV-2026-022", "draft", null, 0, 7),
  document("doc-cv", "cv", "Profesionalni CV — Demo", "CV-001", "draft", null, 0, 9),
];
