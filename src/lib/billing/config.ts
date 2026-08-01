import "server-only";
import type { BillingInterval, PlanId } from "./types";
import { getPlan } from "./plans";
export function getBillingConfig() { const requested = process.env.BILLING_PROVIDER === "stripe" ? "stripe" : "mock"; const enabled = process.env.BILLING_ENABLED !== "false"; const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET); return { enabled, provider: enabled && requested === "stripe" && stripeReady ? "stripe" as const : "mock" as const, stripeReady, appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", graceDays: Number(process.env.BILLING_GRACE_DAYS || 7) }; }
export function serverPriceId(planId: Exclude<PlanId, "free">, interval: BillingInterval) { const env = getPlan(planId).prices[interval].priceEnv; const priceId = env ? process.env[env] : undefined; if (!priceId) throw new Error("BILLING_PRICE_NOT_CONFIGURED"); return priceId; }

