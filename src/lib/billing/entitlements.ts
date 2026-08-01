import { getPlan, planCatalog } from "./plans";
import type { BillingSubscription, EntitlementKey, PlanId, UsageKey } from "./types";
export type EntitlementResult = { allowed: boolean; reason?: string; requiredPlan?: PlanId };
export function checkEntitlement(planId: PlanId, entitlement: EntitlementKey): EntitlementResult { if (getPlan(planId).entitlements[entitlement]) return { allowed: true }; const requiredPlan = (Object.keys(planCatalog) as PlanId[]).find((id) => planCatalog[id].entitlements[entitlement]); return { allowed: false, reason: `Funkcija nije uključena u ${getPlan(planId).name} paket.`, requiredPlan }; }
export function effectivePlan(subscription?: BillingSubscription | null): PlanId { if (!subscription) return "free"; if (["active","trialing","manually_granted"].includes(subscription.status)) return subscription.planId; if (subscription.status === "past_due" && new Date(subscription.currentPeriodEnd) > new Date()) return subscription.planId; return "free"; }
export function getLimit(planId: PlanId, key: UsageKey) { return getPlan(planId).limits[key]; }

