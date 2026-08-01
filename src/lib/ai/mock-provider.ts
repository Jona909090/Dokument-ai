import { randomUUID } from "node:crypto";
import { detectDocumentType, documentTypeDefinitions, type DocumentType } from "@/lib/document-types";
import { wizardQuestions } from "@/lib/wizard";
import type { AIProvider, AIProviderResponse } from "./provider";
import type { AIFieldSuggestion, AIItemSuggestion, AIRequest } from "./types";

const units = "m²|m³|m2|m3|kom|kg|t|l|m|sat|dan|paket|vreća|rola|paleta|usluga";
const itemPattern = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${units})\\s+([^,.]+?)(?:\\s+(?:po|@)\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:€|eur))?(?=,|\\si\\s\\d|$)`, "giu");

function classify(prompt: string) {
  const localType = detectDocumentType(prompt);
  const conversion = /pretvori|konvertiraj/i.test(prompt);
  const translation = /prevedi|na englesk|na njemačk/i.test(prompt);
  const type: DocumentType | "unknown" = localType ?? (/reklamacij/i.test(prompt) ? "business-letter" : "unknown");
  return { intent: conversion ? "convert" as const : translation ? "translate" as const : "create" as const, documentType: type, documentCategory: ["invoice", "proforma", "offer", "purchase-order"].includes(type) ? "finance" : ["daily-report", "completed-works-report", "work-handover"].includes(type) ? "construction" : "administration", confidence: type === "unknown" ? 0.28 : 0.93, language: /englesk|english/i.test(prompt) ? "en" : "hr", tone: /profesional/i.test(prompt) ? "professional" : null, referencedEntities: [], extractedSummary: prompt.slice(0, 240), requiresClarification: type === "unknown", clarificationReason: type === "unknown" ? "Nije moguće pouzdano prepoznati vrstu dokumenta." : null };
}

function extractItems(prompt: string): AIItemSuggestion[] {
  const items: AIItemSuggestion[] = [];
  for (const match of prompt.matchAll(itemPattern)) items.push({ id: randomUUID(), quantity: Number(match[1].replace(",", ".")), unit: match[2].replace("m2", "m²").replace("m3", "m³"), name: match[3].trim(), description: "", unitPrice: match[4] ? Number(match[4].replace(",", ".")) : null, taxRate: /pdv(?:-om)?\s*25/i.test(prompt) ? 25 : null, group: null, note: null, confidence: 0.94, requiresConfirmation: Boolean(!match[4]), visible: true, includeInCalculation: true });
  return items;
}

function fieldsFor(type: DocumentType | "unknown", prompt: string): AIFieldSuggestion[] {
  if (type === "unknown") return [];
  const values: Record<string, string | null> = {};
  const subject = prompt.match(/(?:za|o)\s+(.+?)(?:\s+od\s+\d|\s+za\s+\d|[.]|$)/i)?.[1];
  if (subject) values.subject = subject.trim();
  return wizardQuestions[type].map((question) => ({ field: question.id, value: values[question.id] ?? null, source: values[question.id] ? "user" : "missing", confidence: values[question.id] ? 0.82 : 0, wasInferred: false, requiresConfirmation: !values[question.id] && Boolean(question.required), reason: values[question.id] ? "Navedeno u korisničkom zahtjevu." : "Podatak nije naveden." }));
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock" as const;
  async moderate(input: string) { void input; return { flagged: false, categories: [] }; }
  async generate(request: AIRequest, signal?: AbortSignal): Promise<AIProviderResponse> {
    if (request.simulation === "limit") throw new Error("AI_LIMIT_EXCEEDED");
    if (request.simulation === "error") throw new Error("AI_PROVIDER_UNAVAILABLE");
    await new Promise<void>((resolve, reject) => { const timer = setTimeout(resolve, request.simulation === "timeout" ? 60_000 : 650); signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true }); });
    const classification = classify(request.prompt);
    const fields = fieldsFor(classification.documentType, request.prompt);
    const label = classification.documentType === "unknown" ? "Novi dokument" : documentTypeDefinitions[classification.documentType].label;
    const items = extractItems(request.prompt);
    return { model: "local-rules-v1", inputTokens: 0, outputTokens: 0, classification, draft: { metadata: { title: label, documentType: classification.documentType, category: classification.documentCategory, language: classification.language, currency: /usd/i.test(request.prompt) ? "USD" : "EUR" }, fields, items, sections: [], groups: [], textBlocks: [], visibilitySuggestions: [], templateSuggestion: classification.documentCategory === "construction" ? "construction-professional" : "business-classic", warnings: items.some((item) => item.unitPrice === null) ? ["Cijene nisu dodane jer ih korisnik nije naveo."] : [], missingFields: fields.filter((field) => field.requiresConfirmation).map((field) => field.field), validationIssues: fields.filter((field) => field.requiresConfirmation).map((field) => ({ level: "warning" as const, field: field.field, message: `Potrebno je potvrditi: ${field.field}.` })) } };
  }
}
