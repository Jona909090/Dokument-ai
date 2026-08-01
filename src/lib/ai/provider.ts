import type { AIRequest } from "./types";
import type { ProviderStructuredResult } from "./schemas";

export type AIProviderResponse = ProviderStructuredResult & { model: string; inputTokens: number; outputTokens: number };
export interface AIProvider { readonly name: "openai" | "mock"; generate(request: AIRequest, signal?: AbortSignal): Promise<AIProviderResponse>; moderate(input: string): Promise<{ flagged: boolean; categories: string[] }>; }

