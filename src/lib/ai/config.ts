import "server-only";
import type { AIProviderName } from "./types";

export function getAIConfig() {
  const enabled = process.env.AI_ENABLED !== "false";
  const requested = process.env.AI_PROVIDER === "openai" ? "openai" : "mock";
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  const provider: AIProviderName = !enabled ? "disabled" : requested === "openai" && hasKey ? "openai" : "mock";
  return { enabled, provider, hasKey, model: process.env.OPENAI_MODEL || "gpt-5.6-terra", fallbackModel: process.env.OPENAI_FALLBACK_MODEL || "gpt-5.6-luna", moderationModel: "omni-moderation-latest", timeoutMs: Number(process.env.AI_TIMEOUT_MS || 45_000) };
}

