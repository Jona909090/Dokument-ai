import { aiRequestSchema } from "@/lib/ai/schemas";
import { runAI } from "@/lib/ai/service";
import { toPublicAIError } from "@/lib/ai/errors";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const body = aiRequestSchema.parse(await request.json()); const result = await runAI(body, request.signal); return Response.json(result, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
  catch (error) { const safe = toPublicAIError(error); return Response.json({ error: { code: safe.code, message: safe.message } }, { status: safe.status, headers: { "Cache-Control": "no-store" } }); }
}

