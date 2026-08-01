import type { AICopilotResult } from "./types";

export const AI_HANDOFF_KEY = "dokument-ai:ai-handoff";
export type AIHandoff = { createdAt: string; prompt: string; result: AICopilotResult };

export function answersFromAIDraft(result: AICopilotResult) {
  const answers: Record<string, string> = {};
  for (const field of result.draft.fields) if (field.value !== null) answers[field.field] = String(field.value);
  if (result.draft.items.length) answers.items = result.draft.items.map((item) => `${item.quantity} ${item.unit} ${item.name}${item.unitPrice === null ? "" : ` po ${item.unitPrice} EUR`}`.trim()).join("\n");
  return answers;
}

export function saveAIHandoff(prompt: string, result: AICopilotResult) {
  sessionStorage.setItem(AI_HANDOFF_KEY, JSON.stringify({ createdAt: new Date().toISOString(), prompt, result } satisfies AIHandoff));
}

export function loadAIHandoff(requestId?: string) {
  try {
    const raw = sessionStorage.getItem(AI_HANDOFF_KEY); if (!raw) return null;
    const handoff = JSON.parse(raw) as AIHandoff;
    if (requestId && handoff.result.requestId !== requestId) return null;
    if (Date.now() - new Date(handoff.createdAt).getTime() > 30 * 60 * 1000) return null;
    return handoff;
  } catch { return null; }
}
