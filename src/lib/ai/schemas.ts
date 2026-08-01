import { z } from "zod";
import { documentTypes } from "@/lib/document-types";

const confidence = z.number().min(0).max(1);
export const classificationSchema = z.object({
  intent: z.enum(["create", "edit", "convert", "rewrite", "translate", "analyze"]),
  documentType: z.enum([...documentTypes, "unknown"]),
  documentCategory: z.string(), confidence, language: z.string(), tone: z.string().nullable(),
  referencedEntities: z.array(z.string()), extractedSummary: z.string(), requiresClarification: z.boolean(), clarificationReason: z.string().nullable(),
});
export const fieldSuggestionSchema = z.object({ field: z.string(), value: z.union([z.string(), z.number(), z.boolean()]).nullable(), source: z.enum(["user", "profile", "document", "inferred", "missing"]), confidence, wasInferred: z.boolean(), requiresConfirmation: z.boolean(), reason: z.string() });
export const itemSuggestionSchema = z.object({ id: z.string(), name: z.string(), description: z.string(), quantity: z.number().nonnegative(), unit: z.string(), unitPrice: z.number().nonnegative().nullable(), taxRate: z.number().min(0).max(100).nullable(), group: z.string().nullable(), note: z.string().nullable(), confidence, requiresConfirmation: z.boolean(), visible: z.boolean(), includeInCalculation: z.boolean() });
export const draftSchema = z.object({
  metadata: z.object({ title: z.string(), documentType: z.string(), category: z.string(), language: z.string(), currency: z.string() }),
  fields: z.array(fieldSuggestionSchema), items: z.array(itemSuggestionSchema),
  sections: z.array(z.object({ key: z.string(), title: z.string(), content: z.string(), visible: z.boolean() })),
  groups: z.array(z.object({ name: z.string(), itemIds: z.array(z.string()), visible: z.boolean() })),
  textBlocks: z.array(z.object({ title: z.string(), content: z.string(), visible: z.boolean() })),
  visibilitySuggestions: z.array(z.string()), templateSuggestion: z.string().nullable(), warnings: z.array(z.string()), missingFields: z.array(z.string()),
  validationIssues: z.array(z.object({ level: z.enum(["error", "warning", "recommendation", "information"]), field: z.string().nullable(), message: z.string() })),
});
export const providerResultSchema = z.object({ classification: classificationSchema, draft: draftSchema });
export const aiRequestSchema = z.object({ prompt: z.string().trim().min(3).max(12_000), action: z.enum(["classify", "extract", "draft", "rewrite", "translate", "validate", "summarize", "email", "convert"]).default("draft"), idempotencyKey: z.string().min(8).max(128), targetLanguage: z.string().max(40).optional(), simulation: z.enum(["error", "limit", "timeout"]).optional(), context: z.object({ userId: z.string().uuid().optional(), organizationId: z.string().uuid().optional(), documentId: z.string().uuid().optional(), company: z.record(z.string(), z.string()).optional(), contact: z.record(z.string(), z.string()).optional(), project: z.record(z.string(), z.string()).optional(), privacy: z.object({ allowCompany: z.boolean(), allowContact: z.boolean(), allowDocument: z.boolean(), allowPreferences: z.boolean() }) }).optional() });
export type ProviderStructuredResult = z.infer<typeof providerResultSchema>;

