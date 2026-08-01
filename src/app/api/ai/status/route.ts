import { getAIConfig } from "@/lib/ai/config";
export const dynamic = "force-dynamic";
export async function GET() { const config = getAIConfig(); return Response.json({ enabled: config.enabled, provider: config.provider, connected: config.provider === "openai", model: config.provider === "openai" ? config.model : "local-rules-v1" }, { headers: { "Cache-Control": "no-store" } }); }

