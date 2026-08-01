import { checkoutSchema } from "@/lib/billing/schemas";
import { requireBillingActor } from "@/lib/billing/actor";
import { billingProvider } from "@/lib/billing/service";
export async function POST(request: Request) { try { const actor = await requireBillingActor(); const input = checkoutSchema.parse(await request.json()); const session = await billingProvider().createCheckout({ ...input, organizationId: actor.organizationId, userId: actor.userId, email: actor.email }); return Response.json(session, { headers: { "Cache-Control": "no-store" } }); } catch (error) { const code = error instanceof Error ? error.message : "CHECKOUT_FAILED"; const status = code.includes("dozvolu") ? 403 : 400; return Response.json({ error: { code, message: code === "BILLING_PRICE_NOT_CONFIGURED" ? "Stripe cijena nije konfigurirana. Koristite Demo naplatu ili dodajte Price ID." : code === "INVALID_COUPON" ? "Kupon nije važeći." : "Checkout nije moguće pokrenuti." } }, { status }); } }

