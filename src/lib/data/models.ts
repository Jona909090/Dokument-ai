import type { DocumentType } from "../document-types";
import type { GeneratedDocument } from "../generated-document";
import type { DocumentCategory } from "../analytics/types";

export type UserPlan = "free" | "pro" | "business";
export type DocumentStatus = "draft" | "completed" | "sent" | "accepted" | "rejected" | "paid" | "archived";

export type User = { id: string; firstName: string; lastName: string; email: string; language: "hr" | "en"; country: string; plan: UserPlan; createdAt: string; updatedAt: string };
export type Company = { id: string; userId: string; companyName: string; logoUrl: string; address: string; city: string; postalCode: string; country: string; taxNumber: string; vatNumber: string; registrationNumber: string; iban: string; swift: string; bankName: string; phone: string; email: string; website: string; responsiblePerson: string; signatureUrl: string; stampUrl: string; createdAt: string; updatedAt: string };
export type Contact = { id: string; userId: string; companyName: string; contactName: string; address: string; city: string; postalCode: string; country: string; taxNumber: string; email: string; phone: string; note: string; createdAt: string; updatedAt: string };
export type SavedDocument = { id: string; userId: string; companyId: string | null; contactId: string | null; documentType: DocumentType; documentCategory: DocumentCategory; title: string; documentNumber: string; status: DocumentStatus; language: "hr" | "en"; currency: string; subtotal: number; taxAmount: number; total: number; formData: Record<string, unknown>; content: GeneratedDocument; createdAt: string; updatedAt: string; lastOpenedAt: string };

export type RepositoryEntity = User | Company | Contact | SavedDocument;
