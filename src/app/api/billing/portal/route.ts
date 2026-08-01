import { requireBillingActor } from "@/lib/billing/actor";
import { billingProvider } from "@/lib/billing/service";
import { getBillingConfig } from "@/lib/billing/config";
import { createClient } from "@/lib/supabase/server";
export async function POST() { try { const actor = await requireBillingActor(); let customerId = "demo_customer"; if (!actor.demo && getBillingConfig().provider === "stripe") { const supabase = await createClient(); const { data } = await supabase.from("billing_customers").select("stripe_customer_id").eq("organization_id", actor.organizationId).single(); if (!data?.stripe_customer_id) throw new Error("BILLING_CUSTOMER_MISSING"); customerId = data.stripe_customer_id; } const session = await billingProvider().createPortal({ customerId, organizationId: actor.organizationId, returnUrl: `${getBillingConfig().appUrl}/billing` }); return Response.json(session, { headers: { "Cache-Control": "no-store" } }); } catch { return Response.json({ error: { message: "Portal naplate trenutačno nije dostupan." } }, { status: 400 }); } }

