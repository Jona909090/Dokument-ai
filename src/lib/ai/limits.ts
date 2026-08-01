import type { AIAction } from "./types";
import { billingAICreditLimits } from "@/lib/billing/plans";

export const creditCosts: Record<AIAction, number> = { classify: 1, extract: 2, draft: 8, rewrite: 2, translate: 3, validate: 2, summarize: 2, email: 3, convert: 6 };
export const planLimits = billingAICreditLimits;
const localUsage = new Map<string, { period: string; used: number }>();
export function checkAndConsumeCredits(subject: string, action: AIAction, plan: keyof typeof planLimits = "free") { const period = new Date().toISOString().slice(0, 7); const current = localUsage.get(subject); const used = current?.period === period ? current.used : 0; const cost = creditCosts[action]; const limit = planLimits[plan]; if (used + cost > limit) throw new Error("AI_LIMIT_EXCEEDED"); localUsage.set(subject, { period, used: used + cost }); return { cost, remaining: limit - used - cost, renewsAt: `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 2).padStart(2, "0")}-01` }; }
