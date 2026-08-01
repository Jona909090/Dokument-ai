import { billingProvider } from "@/lib/billing/service";
import { processBillingWebhook } from "@/lib/billing/webhook-service";
export const runtime = "nodejs";
export async function POST(request: Request) { const signature = request.headers.get("stripe-signature") ?? ""; const payload = await request.text(); try { const event = await billingProvider().verifyWebhook(payload, signature); const result = await processBillingWebhook(event); return Response.json({ received: true, ...result }); } catch { return Response.json({ error: "Invalid webhook signature or payload." }, { status: 400 }); } }

