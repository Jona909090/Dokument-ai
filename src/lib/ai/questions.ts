import { wizardQuestions } from "@/lib/wizard";
import type { AIFieldSuggestion, AIQuestion } from "./types";
import type { DocumentType } from "@/lib/document-types";
export function createMissingQuestions(type: DocumentType | "unknown", fields: AIFieldSuggestion[]): AIQuestion[] { if (type === "unknown") return [{ id: "document-type", field: "documentType", question: "Koju vrstu dokumenta želite napraviti?", priority: "required", canSkip: false }]; const missing = new Set(fields.filter((f) => f.value === null || f.value === "").map((f) => f.field)); return wizardQuestions[type].filter((q) => missing.has(q.id)).map((q) => ({ id: q.id, field: q.id, question: q.question, priority: q.required ? "required" : "optional", canSkip: !q.required })); }

