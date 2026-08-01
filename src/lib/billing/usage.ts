import { randomUUID } from "node:crypto";
import { getLimit } from "./entitlements";
import type { PlanId, UsageKey } from "./types";
const usage = new Map<string, { value: number; keys: Set<string> }>();
const bucket = (organizationId: string, key: UsageKey) => `${organizationId}:${new Date().toISOString().slice(0, 7)}:${key}`;
export function getRemainingUsage(organizationId: string, planId: PlanId, key: UsageKey) { const current = usage.get(bucket(organizationId, key))?.value ?? 0; const limit = getLimit(planId, key); return { current, limit, remaining: Math.max(0, limit - current), percentage: limit ? Math.min(100, Math.round(current / limit * 100)) : 100 }; }
export function checkUsageLimit(organizationId: string, planId: PlanId, key: UsageKey, amount = 1) { const state = getRemainingUsage(organizationId, planId, key); return { ...state, allowed: state.current + amount <= state.limit }; }
export function consumeUsage(organizationId: string, planId: PlanId, key: UsageKey, amount = 1, idempotencyKey = randomUUID()) { const state = checkUsageLimit(organizationId, planId, key, amount); if (!state.allowed) throw new Error(`USAGE_LIMIT:${key}`); const id = bucket(organizationId, key); const current = usage.get(id) ?? { value: 0, keys: new Set<string>() }; if (!current.keys.has(idempotencyKey)) { current.value += amount; current.keys.add(idempotencyKey); usage.set(id, current); } return getRemainingUsage(organizationId, planId, key); }
export function refundUsage(organizationId: string, key: UsageKey, amount: number, idempotencyKey: string) { const current = usage.get(bucket(organizationId, key)); if (current?.keys.has(idempotencyKey)) { current.value = Math.max(0, current.value - amount); current.keys.delete(idempotencyKey); } }
