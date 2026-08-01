import { z } from "zod";
export const checkoutSchema = z.object({ planId: z.enum(["basic","pro","business"]), interval: z.enum(["month","year"]), seats: z.number().int().min(1).max(500).default(1), coupon: z.string().trim().max(64).optional(), idempotencyKey: z.string().uuid() });
export const cancelSchema = z.object({ atPeriodEnd: z.boolean(), reason: z.enum(["too_expensive","not_using","missing_features","technical","switching","temporary","other"]), comment: z.string().max(500).optional() });

