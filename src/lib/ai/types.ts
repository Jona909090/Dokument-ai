import type { DocumentType } from "@/lib/document-types";

export const aiActions = ["classify", "extract", "draft", "rewrite", "translate", "validate", "summarize", "email", "convert"] as const;
export type AIAction = (typeof aiActions)[number];
export type AIProviderName = "openai" | "mock" | "disabled";
export type AIIntent = "create" | "edit" | "convert" | "rewrite" | "translate" | "analyze";
export type AIFieldSource = "user" | "profile" | "document" | "inferred" | "missing";

export type AIFieldSuggestion = {
  field: string;
  value: string | number | boolean | null;
  source: AIFieldSource;
  confidence: number;
  wasInferred: boolean;
  requiresConfirmation: boolean;
  reason: string;
};

export type AIItemSuggestion = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  taxRate: number | null;
  group: string | null;
  note: string | null;
  confidence: number;
  requiresConfirmation: boolean;
  visible: boolean;
  includeInCalculation: boolean;
};

export type AIClassification = {
  intent: AIIntent;
  documentType: DocumentType | "unknown";
  documentCategory: string;
  confidence: number;
  language: string;
  tone: string | null;
  referencedEntities: string[];
  extractedSummary: string;
  requiresClarification: boolean;
  clarificationReason: string | null;
};

export type AIQuestion = {
  id: string;
  field: string;
  question: string;
  priority: "required" | "recommended" | "optional";
  canSkip: boolean;
};

export type AIDocumentDraft = {
  metadata: { title: string; documentType: string; category: string; language: string; currency: string };
  fields: AIFieldSuggestion[];
  items: AIItemSuggestion[];
  sections: Array<{ key: string; title: string; content: string; visible: boolean }>;
  groups: Array<{ name: string; itemIds: string[]; visible: boolean }>;
  textBlocks: Array<{ title: string; content: string; visible: boolean }>;
  visibilitySuggestions: string[];
  templateSuggestion: string | null;
  warnings: string[];
  missingFields: string[];
  validationIssues: Array<{ level: "error" | "warning" | "recommendation" | "information"; field: string | null; message: string }>;
};

export type AICopilotResult = {
  requestId: string;
  provider: AIProviderName;
  model: string;
  classification: AIClassification;
  draft: AIDocumentDraft;
  questions: AIQuestion[];
  usage: { inputTokens: number; outputTokens: number; creditsUsed: number; creditsRemaining: number };
  notice: string;
};

export type AIRequestContext = {
  userId?: string;
  organizationId?: string;
  documentId?: string;
  company?: Record<string, string>;
  contact?: Record<string, string>;
  project?: Record<string, string>;
  privacy: { allowCompany: boolean; allowContact: boolean; allowDocument: boolean; allowPreferences: boolean };
};

export type AIRequest = { prompt: string; action: AIAction; idempotencyKey: string; context?: AIRequestContext; targetLanguage?: string; simulation?: "error" | "limit" | "timeout" };

