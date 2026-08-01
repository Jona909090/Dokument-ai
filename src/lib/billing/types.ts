export const planIds = ["free", "basic", "pro", "business"] as const;
export type PlanId = (typeof planIds)[number];
export type BillingInterval = "month" | "year";
export type SubscriptionStatus = "free" | "trialing" | "active" | "past_due" | "unpaid" | "canceled" | "incomplete" | "incomplete_expired" | "paused" | "manually_granted";
export const entitlementKeys = ["createDocument", "useAI", "exportPDF", "exportDOCX", "removeBranding", "premiumTemplates", "customTemplates", "multipleCompanies", "inviteTeamMembers", "advancedAnalytics", "versionHistory", "cloudStorage", "documentConversion", "bulkExport", "prioritySupport", "auditLog"] as const;
export type EntitlementKey = (typeof entitlementKeys)[number];
export const usageKeys = ["documents", "savedDocuments", "aiActions", "aiCredits", "pdfExports", "docxExports", "companies", "contacts", "projects", "teamMembers", "storageBytes", "attachments", "customTemplates", "documentVersions", "conversions", "bulkOperations"] as const;
export type UsageKey = (typeof usageKeys)[number];
export type PlanDefinition = { id: PlanId; name: string; description: string; recommended?: boolean; trialDays: number; prices: Record<BillingInterval, { amountMinor: number; currency: "EUR"; priceEnv?: string }>; entitlements: Record<EntitlementKey, boolean>; limits: Record<UsageKey, number>; highlights: string[] };
export type BillingSubscription = { organizationId: string; planId: PlanId; status: SubscriptionStatus; interval: BillingInterval; currentPeriodStart: string; currentPeriodEnd: string; trialEnd: string | null; cancelAtPeriodEnd: boolean; provider: "stripe" | "mock" | "manual"; seats: number; paymentState: "none" | "processing" | "paid" | "failed" };
export type CheckoutInput = { organizationId: string; userId: string; email: string; planId: Exclude<PlanId, "free">; interval: BillingInterval; seats: number; coupon?: string; idempotencyKey: string };
export type BillingSession = { id: string; url: string; provider: "stripe" | "mock"; status: "created" | "demo" };
export interface BillingProvider { readonly name: "stripe" | "mock"; createCheckout(input: CheckoutInput): Promise<BillingSession>; createPortal(input: { customerId: string; organizationId: string; returnUrl: string }): Promise<BillingSession>; cancelSubscription(input: { subscriptionId: string; atPeriodEnd: boolean; reason?: string }): Promise<void>; reactivateSubscription(subscriptionId: string): Promise<void>; verifyWebhook(payload: string, signature: string): Promise<{ id: string; type: string; data: unknown }>; }

