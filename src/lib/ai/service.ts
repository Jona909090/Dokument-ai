import "server-only";
import { randomUUID } from "node:crypto";
import { getAIConfig } from "./config";
import { OpenAIProvider } from "./openai-provider";
import { MockAIProvider } from "./mock-provider";
import { createMissingQuestions } from "./questions";
import { checkAndConsumeCredits } from "./limits";
import { providerResultSchema } from "./schemas";
import { PublicAIError, toPublicAIError } from "./errors";
import type { AICopilotResult, AIRequest } from "./types";

const inFlight = new Map<string, Promise<AICopilotResult>>();
export async function runAI(request: AIRequest, signal?: AbortSignal): Promise<AICopilotResult> {
  const existing = inFlight.get(request.idempotencyKey); if (existing) return existing;
  const operation = execute(request, signal).finally(() => inFlight.delete(request.idempotencyKey)); inFlight.set(request.idempotencyKey, operation); return operation;
}
async function execute(request: AIRequest, signal?: AbortSignal): Promise<AICopilotResult> {
  const config = getAIConfig(); if (!config.enabled) throw new PublicAIError("ai_disabled", "AI funkcije su isključene u postavkama.", 403);
  const provider = config.provider === "openai" ? new OpenAIProvider() : new MockAIProvider();
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), config.timeoutMs); signal?.addEventListener("abort", () => controller.abort(), { once: true });
  try { const safety = await provider.moderate(request.prompt); if (safety.flagged) throw new PublicAIError("unsafe_input", "Zahtjev nije moguće obraditi u ovom obliku. Uklonite problematičan sadržaj i pokušajte ponovno.", 400); const subject = request.context?.organizationId ?? request.context?.userId ?? "anonymous"; const credits = checkAndConsumeCredits(subject, request.action); const raw = await provider.generate(request, controller.signal); const parsed = providerResultSchema.parse(raw); return { requestId: randomUUID(), provider: provider.name, model: raw.model, classification: parsed.classification, draft: parsed.draft, questions: createMissingQuestions(parsed.classification.documentType, parsed.draft.fields), usage: { inputTokens: raw.inputTokens, outputTokens: raw.outputTokens, creditsUsed: credits.cost, creditsRemaining: credits.remaining }, notice: provider.name === "mock" ? "Demo AI: rezultat je generiran lokalnim pravilima, bez slanja podataka van aplikacije." : "AI prijedlog: pregledajte i potvrdite svaku važnu promjenu prije primjene." }; } catch (error) { throw toPublicAIError(error); } finally { clearTimeout(timeout); }
}

